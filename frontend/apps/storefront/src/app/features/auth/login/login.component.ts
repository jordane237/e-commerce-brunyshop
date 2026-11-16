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
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService, readApiError, SessionService, ToastService } from '@bruny/core';
import { PublicConfigService } from '@bruny/data-access';
import { ButtonComponent, CaptchaComponent, InputComponent } from '@bruny/ui';

import { AuthLayoutComponent } from '../components/auth-layout/auth-layout.component';
import { identifierValidator, normalizeIdentifier } from '../validators/identifier.validator';

type LoginForm = FormGroup<{
  identifier: FormControl<string>;
  password: FormControl<string>;
  turnstileToken: FormControl<string | null>;
}>;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    AuthLayoutComponent,
    ButtonComponent,
    CaptchaComponent,
    InputComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthService);
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
  private readonly publicConfig = inject(PublicConfigService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);

  private readonly formElement = viewChild<ElementRef<HTMLElement>>('loginForm');

  readonly submitting = signal(false);
  readonly submitted = signal(false);
  readonly backendError = signal<string | null>(null);
  readonly siteKey = signal<string | null>(null);
  readonly captchaEnabled = signal(false);
  readonly captchaUnavailable = signal(false);

  readonly form = this.buildForm();

  identifierError(): string | null {
    return this.fieldError('identifier');
  }

  passwordError(): string | null {
    return this.fieldError('password');
  }

  readonly redirectQuery = computed<Record<string, string> | undefined>(() => {
    const redirect = this.safeRedirect();
    return redirect === '/compte' ? undefined : { redirect };
  });

  constructor() {
    const prefilledIdentifier = this.route.snapshot.queryParamMap.get('identifier');
    if (prefilledIdentifier !== null && prefilledIdentifier.trim() !== '') {
      this.form.controls.identifier.setValue(prefilledIdentifier);
    }
    this.loadCaptchaConfig();
  }

  private buildForm(): LoginForm {
    return this.fb.group({
      identifier: this.fb.control('', {
        validators: [Validators.required, identifierValidator],
      }),
      password: this.fb.control('', { validators: [Validators.required] }),
      turnstileToken: new FormControl<string | null>(null),
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
          // Sans configuration, le formulaire reste utilisable. Si le backend
          // exige réellement un jeton, il renverra CAPTCHA_REQUIRED.
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
    this.submitting.set(true);

    this.auth
      .login({
        identifier: normalizeIdentifier(value.identifier),
        password: value.password,
        ...(value.turnstileToken !== null ? { turnstileToken: value.turnstileToken } : {}),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: async (response) => {
          if ('accessToken' in response) {
            const firstName = this.session.user()?.firstName;
            this.toast.success(
              firstName === null || firstName === undefined || firstName.trim() === ''
                ? 'Connexion réussie.'
                : `Bienvenue, ${firstName}.`,
            );
            await this.router.navigateByUrl(this.safeRedirect());
            return;
          }
          this.handleChallenge();
        },
        error: (error: unknown) => {
          this.backendError.set(this.loginErrorMessage(error));
          this.resetCaptcha();
          this.submitting.set(false);
        },
      });
  }

  private handleChallenge(): void {
    this.backendError.set(
      'La vérification en deux étapes doit être effectuée depuis l’espace d’administration.',
    );
    this.resetCaptcha();
    this.submitting.set(false);
  }

  private loginErrorMessage(error: unknown): string {
    const code = readApiError(error)?.code;
    if (code === 'TOO_MANY_ATTEMPTS' || code === 'ACCOUNT_LOCKED') {
      return 'Trop de tentatives. Patientez une minute avant de réessayer.';
    }
    if (code === 'CAPTCHA_REQUIRED' || code === 'CAPTCHA_INVALID') {
      return 'La vérification de sécurité a échoué. Réessayez.';
    }
    if (code === 'CAPTCHA_UNAVAILABLE') {
      return 'La vérification de sécurité est momentanément indisponible. Réessayez dans un instant.';
    }
    if (code === 'INVALID_CREDENTIALS') {
      return 'E-mail/téléphone ou mot de passe incorrect. Vérifiez vos informations ou réinitialisez votre mot de passe.';
    }
    return 'Connexion impossible. Vérifiez votre connexion puis réessayez.';
  }

  private resetCaptcha(): void {
    if (!this.captchaEnabled()) return;
    this.form.controls.turnstileToken.reset(null);
    this.form.controls.turnstileToken.markAsPristine();
    this.form.controls.turnstileToken.markAsUntouched();
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

  private fieldError(field: 'identifier' | 'password'): string | null {
    const control = this.form.controls[field];
    if (!control.touched && !this.submitted()) return null;
    if (control.hasError('required')) {
      return field === 'identifier'
        ? 'Saisissez votre e-mail ou votre numéro de téléphone.'
        : 'Saisissez votre mot de passe.';
    }
    if (control.hasError('identifier')) {
      return 'Saisissez un e-mail valide ou un numéro camerounais (+237 suivi de 9 chiffres).';
    }
    return null;
  }

  private focusFirstInvalid(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    queueMicrotask(() => {
      const root = this.formElement()?.nativeElement;
      const invalid = root?.querySelector<HTMLElement>('[aria-invalid="true"]');
      invalid?.focus();
    });
  }
}
