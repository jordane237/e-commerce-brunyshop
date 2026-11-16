import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  PLATFORM_ID,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { AuthService, readApiError, ToastService } from '@bruny/core';
import { PublicConfigService } from '@bruny/data-access';
import {
  ButtonComponent,
  CaptchaComponent,
  CgvCheckboxComponent,
  InputComponent,
  PasswordStrengthIndicatorComponent,
} from '@bruny/ui';

import { AuthLayoutComponent } from '../components/auth-layout/auth-layout.component';
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  passwordPolicyValidator,
} from '../validators/common-password.validator';
import { matchValidator } from '../validators/match.validator';
import { localPhoneValidator, toInternationalPhone } from '../validators/phone.validator';

export const TERMS_VERSION = '1.0';

type RegisterChannel = 'email' | 'phone';

type RegisterForm = FormGroup<{
  channel: FormControl<RegisterChannel>;
  email: FormControl<string>;
  phone: FormControl<string>;
  firstName: FormControl<string>;
  lastName: FormControl<string>;
  password: FormControl<string>;
  confirmPassword: FormControl<string>;
  cgv: FormControl<boolean>;
  turnstileToken: FormControl<string | null>;
}>;

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    AuthLayoutComponent,
    ButtonComponent,
    CaptchaComponent,
    CgvCheckboxComponent,
    InputComponent,
    PasswordStrengthIndicatorComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
  private readonly publicConfig = inject(PublicConfigService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly formElement = viewChild<ElementRef<HTMLElement>>('registerForm');
  private readonly successTitle = viewChild<ElementRef<HTMLElement>>('successTitle');

  readonly submitting = signal(false);
  readonly submitted = signal(false);
  readonly backendError = signal<string | null>(null);
  readonly siteKey = signal<string | null>(null);
  readonly captchaEnabled = signal(false);
  readonly captchaUnavailable = signal(false);
  readonly successIdentifier = signal<string | null>(null);

  readonly form: RegisterForm = this.buildForm();
  readonly passwordValue = toSignal(this.form.controls.password.valueChanges, {
    initialValue: '',
  });

  emailError(): string | null {
    return this.fieldError('email');
  }

  phoneError(): string | null {
    return this.fieldError('phone');
  }

  firstNameError(): string | null {
    return this.fieldError('firstName');
  }

  lastNameError(): string | null {
    return this.fieldError('lastName');
  }

  passwordError(): string | null {
    return this.fieldError('password');
  }

  confirmPasswordError(): string | null {
    return this.fieldError('confirmPassword');
  }

  cgvError(): string | null {
    return this.fieldError('cgv');
  }

  readonly loginQueryParams = computed<Record<string, string>>(() => {
    const identifier = this.successIdentifier();
    const params: Record<string, string> = {};
    if (identifier !== null) params['identifier'] = identifier;
    const redirect = this.safeRedirect();
    if (redirect !== '/compte') params['returnUrl'] = redirect;
    return params;
  });

  constructor() {
    this.applyChannelValidators('email');
    this.form.controls.password.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.form.controls.confirmPassword.updateValueAndValidity({ emitEvent: false });
      });
    this.loadCaptchaConfig();
    this.focusSuccessTitle();
  }

  private buildForm(): RegisterForm {
    return this.fb.group({
      channel: this.fb.control<RegisterChannel>('email'),
      email: this.fb.control('', { validators: [Validators.required, Validators.email] }),
      phone: this.fb.control('', { validators: [localPhoneValidator] }),
      firstName: this.fb.control('', {
        validators: [Validators.required, Validators.maxLength(100)],
      }),
      lastName: this.fb.control('', {
        validators: [Validators.required, Validators.maxLength(100)],
      }),
      password: this.fb.control('', {
        validators: [Validators.required, passwordPolicyValidator],
      }),
      confirmPassword: this.fb.control('', {
        validators: [Validators.required, matchValidator('password')],
      }),
      cgv: this.fb.control(false, { validators: [Validators.requiredTrue] }),
      turnstileToken: new FormControl<string | null>(null),
    });
  }

  private applyChannelValidators(channel: RegisterChannel): void {
    this.form.controls.email.setValidators(
      channel === 'email' ? [Validators.required, Validators.email] : [Validators.email],
    );
    this.form.controls.phone.setValidators(
      channel === 'phone' ? [Validators.required, localPhoneValidator] : [localPhoneValidator],
    );
    this.form.controls.email.updateValueAndValidity({ emitEvent: false });
    this.form.controls.phone.updateValueAndValidity({ emitEvent: false });
  }

  selectChannel(channel: RegisterChannel): void {
    if (this.form.controls.channel.value === channel) return;
    this.form.controls.channel.setValue(channel);
    if (channel === 'email') {
      this.form.controls.phone.reset('');
      this.form.controls.email.markAsUntouched();
    } else {
      this.form.controls.email.reset('');
      this.form.controls.phone.markAsUntouched();
    }
    this.applyChannelValidators(channel);
    this.backendError.set(null);
  }

  onTabKeydown(event: KeyboardEvent, channel: RegisterChannel): void {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const next: RegisterChannel = channel === 'email' ? 'phone' : 'email';
    this.selectChannel(next);
    if (!isPlatformBrowser(this.platformId)) return;
    queueMicrotask(() => {
      this.formElement()
        ?.nativeElement.querySelector<HTMLElement>(`[data-channel="${next}"]`)
        ?.focus();
    });
  }

  private loadCaptchaConfig(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.publicConfig
      .getConfig()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (config) => {
          if (!config.turnstileEnabled) return;
          if (config.turnstileSiteKey === null || config.turnstileSiteKey.trim() === '') {
            this.captchaUnavailable.set(true);
            this.backendError.set('La vérification de sécurité est mal configurée.');
            return;
          }
          this.siteKey.set(config.turnstileSiteKey);
          this.captchaEnabled.set(true);
          this.form.controls.turnstileToken.setValidators([Validators.required]);
          this.form.controls.turnstileToken.updateValueAndValidity();
        },
        error: () => {
          this.captchaUnavailable.set(false);
        },
      });
  }

  onSubmit(): void {
    if (this.submitting()) return;
    this.submitted.set(true);
    this.backendError.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.focusFirstInvalid();
      return;
    }

    const value = this.form.getRawValue();
    const identifier =
      value.channel === 'email'
        ? value.email.trim().toLowerCase()
        : toInternationalPhone(value.phone);

    this.submitting.set(true);
    this.auth
      .register({
        password: value.password,
        firstName: value.firstName.trim(),
        lastName: value.lastName.trim(),
        termsAccepted: true,
        termsVersion: TERMS_VERSION,
        ...(value.channel === 'email' ? { email: identifier } : { phone: identifier }),
        ...(value.turnstileToken !== null ? { turnstileToken: value.turnstileToken } : {}),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.successIdentifier.set(identifier);
          this.submitting.set(false);
          this.toast.success('Votre compte est créé.');
          this.focusSuccessTitle();
        },
        error: (error: unknown) => {
          this.backendError.set(this.registerErrorMessage(error));
          this.resetCaptcha();
          this.submitting.set(false);
        },
      });
  }

  private registerErrorMessage(error: unknown): string {
    const code = readApiError(error)?.code;
    if (code === 'TOO_MANY_ATTEMPTS') {
      return 'Trop de tentatives. Patientez une minute avant de réessayer.';
    }
    if (code === 'CAPTCHA_REQUIRED' || code === 'CAPTCHA_INVALID') {
      return 'La vérification de sécurité a échoué. Réessayez.';
    }
    if (code === 'CAPTCHA_UNAVAILABLE') {
      return 'La vérification de sécurité est momentanément indisponible. Réessayez dans un instant.';
    }
    if (code === 'WEAK_PASSWORD') {
      return 'Le mot de passe ne respecte pas les règles de sécurité. Choisissez-en un plus robuste.';
    }
    return 'Impossible de créer votre compte. Vérifiez votre connexion puis réessayez.';
  }

  private resetCaptcha(): void {
    if (!this.captchaEnabled()) return;
    this.form.controls.turnstileToken.reset(null);
    this.form.controls.turnstileToken.markAsPristine();
    this.form.controls.turnstileToken.markAsUntouched();
  }

  private focusSuccessTitle(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    queueMicrotask(() => this.successTitle()?.nativeElement.focus());
  }

  private focusFirstInvalid(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    queueMicrotask(() => {
      const root = this.formElement()?.nativeElement;
      const invalid = root?.querySelector<HTMLElement>('[aria-invalid="true"]');
      invalid?.focus();
    });
  }

  private safeRedirect(): string {
    const returnUrl =
      this.route.snapshot.queryParamMap.get('returnUrl') ??
      this.route.snapshot.queryParamMap.get('redirect');
    if (returnUrl !== null && returnUrl.startsWith('/') && !returnUrl.startsWith('//')) {
      return returnUrl;
    }
    return '/compte';
  }

  private fieldError(
    field: 'email' | 'phone' | 'firstName' | 'lastName' | 'password' | 'confirmPassword' | 'cgv',
  ): string | null {
    const control = this.form.controls[field];
    if (!control.touched && !this.submitted()) return null;

    if (control.hasError('required') || control.hasError('requiredTrue')) {
      return {
        email: 'Saisissez votre adresse e-mail.',
        phone: 'Saisissez votre numéro de téléphone.',
        firstName: 'Indiquez votre prénom.',
        lastName: 'Indiquez votre nom.',
        password: 'Saisissez votre mot de passe.',
        confirmPassword: 'Confirmez votre mot de passe.',
        cgv: 'Acceptez les conditions générales pour créer votre compte.',
      }[field];
    }
    if (control.hasError('email')) {
      return 'Saisissez un e-mail valide, par exemple vous@exemple.com.';
    }
    if (control.hasError('localPhone')) {
      return 'Saisissez un numéro camerounais à 9 chiffres après +237.';
    }
    if (control.hasError('maxlength')) {
      if (field === 'firstName') return 'Le prénom ne doit pas dépasser 100 caractères.';
      if (field === 'lastName') return 'Le nom ne doit pas dépasser 100 caractères.';
      return `Le mot de passe ne doit pas dépasser ${PASSWORD_MAX_LENGTH} caractères.`;
    }
    if (control.hasError('minlength')) {
      return `Votre mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères.`;
    }
    if (control.hasError('commonPassword')) {
      return 'Ce mot de passe est trop courant. Choisissez une phrase plus difficile à deviner.';
    }
    if (control.hasError('passwordVariety')) {
      return 'Mélangez au moins deux catégories : minuscules, majuscules, chiffres, symboles.';
    }
    if (control.hasError('mismatch')) {
      return 'Les deux mots de passe ne correspondent pas.';
    }
    return null;
  }
}
