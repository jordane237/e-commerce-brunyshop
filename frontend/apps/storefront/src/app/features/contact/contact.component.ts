import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  PLATFORM_ID,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';

import { readApiError } from '@bruny/core';
import { ContactApi, PublicConfigService, type ContactRequest } from '@bruny/data-access';
import {
  ButtonComponent,
  CaptchaComponent,
  CheckboxComponent,
  IconComponent,
  InputComponent,
  SelectComponent,
  type SelectOption,
} from '@bruny/ui';

import { APP_CONFIG } from '../../core/app-config';
import { SeoService } from '../../core/seo.service';
import {
  LegalPageLayoutComponent,
  type BreadcrumbItem,
} from '../shared/components/legal-page-layout/legal-page-layout.component';
import { ContactTextareaComponent } from './components/contact-textarea/contact-textarea.component';

type ContactSubject = ContactRequest['subject'];
type ContactForm = FormGroup<{
  name: FormControl<string>;
  email: FormControl<string>;
  phone: FormControl<string>;
  subject: FormControl<ContactSubject | ''>;
  orderReference: FormControl<string>;
  message: FormControl<string>;
  consent: FormControl<boolean>;
  turnstileToken: FormControl<string | null>;
  honeypot: FormControl<string>;
}>;

const CAMEROON_PHONE = /^[26][0-9]{8}$/;
const ORDER_REFERENCE = /^BRN-[0-9]{4}-[A-Z0-9]{4}$/i;

function optionalCameroonPhone(control: AbstractControl): ValidationErrors | null {
  const value = String(control.value ?? '').trim();
  if (value === '') return null;
  const digits = value.replace(/[\s.-]/g, '');
  return CAMEROON_PHONE.test(digits) ? null : { cameroonPhone: true };
}

function optionalOrderReference(control: AbstractControl): ValidationErrors | null {
  const value = String(control.value ?? '').trim();
  if (value === '') return null;
  return ORDER_REFERENCE.test(value) ? null : { orderReference: true };
}

@Component({
  selector: 'bruny-contact',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    LegalPageLayoutComponent,
    ButtonComponent,
    CaptchaComponent,
    CheckboxComponent,
    ContactTextareaComponent,
    IconComponent,
    InputComponent,
    SelectComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss',
})
export class ContactComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly contactApi = inject(ContactApi);
  private readonly publicConfig = inject(PublicConfigService);
  private readonly config = inject(APP_CONFIG);
  private readonly seo = inject(SeoService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly formElement = viewChild<ElementRef<HTMLElement>>('contactForm');
  private readonly successTitle = viewChild<ElementRef<HTMLElement>>('successTitle');

  readonly submitting = signal(false);
  readonly submitted = signal(false);
  readonly backendError = signal<string | null>(null);
  readonly successId = signal<string | null>(null);
  readonly siteKey = signal<string | null>(null);
  readonly captchaEnabled = signal(false);
  readonly captchaUnavailable = signal(false);

  readonly whatsappUrl = this.config.contactWhatsappUrl;
  readonly phoneHref = computed(() => `tel:${this.config.contactPhone}`);
  readonly facebookUrl = this.config.contactFacebookUrl;
  readonly phoneDisplay = this.config.contactPhoneDisplay;
  readonly supportEmail = this.config.supportEmail;

  readonly breadcrumb: readonly BreadcrumbItem[] = [
    { label: 'Accueil', path: '/' },
    { label: 'Contact' },
  ];

  readonly subjectOptions: SelectOption[] = [
    { value: 'order', label: 'Une commande' },
    { value: 'product', label: 'Un produit ou une taille' },
    { value: 'return', label: 'Un retour ou un échange' },
    { value: 'delivery', label: 'Une livraison' },
    { value: 'other', label: 'Autre demande' },
  ];

  readonly intro =
    'Une question sur une commande, un produit ou un retour ? Écrivez-nous. Notre équipe vous répond sous 24 h ouvrées, du lundi au samedi, de 8 h à 18 h.';

  readonly form: ContactForm = this.buildForm();
  readonly messageValue = toSignal(this.form.controls.message.valueChanges, {
    initialValue: '',
  });

  ngOnInit(): void {
    this.seo.setPageMeta({
      title: 'Contact',
      description:
        'Contactez BRUNY SHOPPING pour une commande, un produit, une livraison ou un retour. Réponse sous 24 h ouvrées, WhatsApp et téléphone disponibles.',
      canonicalPath: '/contact',
    });
    this.loadCaptchaConfig();
  }

  nameError(): string | null {
    const control = this.form.controls.name;
    if (!this.showError(control)) return null;
    if (control.hasError('required')) return 'Indiquez votre nom.';
    if (control.hasError('minlength')) return 'Votre nom doit contenir au moins 2 caractères.';
    if (control.hasError('maxlength')) return 'Votre nom ne doit pas dépasser 100 caractères.';
    return null;
  }

  emailError(): string | null {
    const control = this.form.controls.email;
    if (!this.showError(control)) return null;
    if (control.hasError('required')) return 'Saisissez votre adresse e-mail.';
    if (control.hasError('email')) {
      return 'Saisissez un e-mail valide, par exemple vous@exemple.com.';
    }
    return null;
  }

  phoneError(): string | null {
    const control = this.form.controls.phone;
    if (!this.showError(control)) return null;
    if (control.hasError('cameroonPhone')) {
      return 'Saisissez un numéro camerounais à 9 chiffres après +237.';
    }
    return null;
  }

  subjectError(): string | null {
    const control = this.form.controls.subject;
    if (!this.showError(control)) return null;
    if (control.hasError('required')) return 'Choisissez le sujet de votre demande.';
    return null;
  }

  orderReferenceError(): string | null {
    const control = this.form.controls.orderReference;
    if (!this.showError(control)) return null;
    if (control.hasError('orderReference')) {
      return 'Utilisez le format BRN-2611-7K3F indiqué dans votre confirmation.';
    }
    return null;
  }

  messageError(): string | null {
    const control = this.form.controls.message;
    if (!this.showError(control)) return null;
    if (control.hasError('required')) return 'Écrivez votre message.';
    if (control.hasError('minlength')) {
      return 'Décrivez votre demande en au moins 20 caractères.';
    }
    if (control.hasError('maxlength')) {
      return 'Votre message ne doit pas dépasser 2 000 caractères.';
    }
    return null;
  }

  consentError(): string | null {
    const control = this.form.controls.consent;
    if (!this.showError(control)) return null;
    return control.hasError('requiredTrue')
      ? 'Acceptez d’être recontacté(e) au sujet de votre demande.'
      : null;
  }

  onSubjectChange(value: string): void {
    const subject = value as ContactSubject | '';
    this.form.controls.subject.setValue(subject);
    this.form.controls.subject.markAsDirty();
    this.form.controls.subject.markAsTouched();
    this.backendError.set(null);
  }

  onConsentChange(checked: boolean): void {
    this.form.controls.consent.setValue(checked);
    this.form.controls.consent.markAsDirty();
    this.form.controls.consent.markAsTouched();
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
    const phone = value.phone.replace(/[\s.-]/g, '');
    const orderReference = value.orderReference.trim().toUpperCase();

    const payload: ContactRequest = {
      name: value.name.trim(),
      email: value.email.trim().toLowerCase(),
      subject: value.subject as ContactSubject,
      message: value.message.trim(),
      consent: true,
      ...(phone !== '' ? { phone: `+237${phone}` } : {}),
      ...(orderReference !== '' ? { orderReference } : {}),
      ...(value.turnstileToken !== null ? { turnstileToken: value.turnstileToken } : {}),
      ...(value.honeypot !== '' ? { _honey: value.honeypot } : {}),
    };

    this.submitting.set(true);
    this.contactApi
      .submit(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.successId.set(response.id);
          this.submitting.set(false);
          this.focusSuccessTitle();
        },
        error: (error: unknown) => {
          this.backendError.set(this.contactErrorMessage(error));
          this.resetCaptcha();
          this.submitting.set(false);
        },
      });
  }

  startNewMessage(): void {
    this.successId.set(null);
    this.submitted.set(false);
    this.backendError.set(null);
    this.form.reset({
      name: '',
      email: '',
      phone: '',
      subject: '',
      orderReference: '',
      message: '',
      consent: false,
      turnstileToken: null,
      honeypot: '',
    });
    this.resetCaptcha();
    if (!isPlatformBrowser(this.platformId)) return;
    queueMicrotask(() => {
      this.formElement()?.nativeElement.querySelector<HTMLElement>('input#contact-name')?.focus();
    });
  }

  private buildForm(): ContactForm {
    return this.fb.group({
      name: this.fb.control('', {
        validators: [Validators.required, Validators.minLength(2), Validators.maxLength(100)],
      }),
      email: this.fb.control('', {
        validators: [Validators.required, Validators.email, Validators.maxLength(254)],
      }),
      phone: this.fb.control('', { validators: [optionalCameroonPhone] }),
      subject: this.fb.control<ContactSubject | ''>('', {
        validators: [Validators.required],
      }),
      orderReference: this.fb.control('', { validators: [optionalOrderReference] }),
      message: this.fb.control('', {
        validators: [Validators.required, Validators.minLength(20), Validators.maxLength(2000)],
      }),
      consent: this.fb.control(false, { validators: [Validators.requiredTrue] }),
      turnstileToken: new FormControl<string | null>(null),
      honeypot: this.fb.control(''),
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
            this.backendError.set(
              'La vérification de sécurité est mal configurée. Réessayez plus tard.',
            );
            return;
          }
          this.siteKey.set(config.turnstileSiteKey);
          this.captchaEnabled.set(true);
          this.form.controls.turnstileToken.setValidators([Validators.required]);
          this.form.controls.turnstileToken.updateValueAndValidity();
        },
        error: () => {
          this.captchaUnavailable.set(true);
          this.backendError.set(
            'La vérification de sécurité ne peut pas être chargée. Vérifiez votre connexion puis rechargez la page.',
          );
        },
      });
  }

  private contactErrorMessage(error: unknown): string {
    const code = readApiError(error)?.code;
    if (code === 'RATE_LIMITED') {
      return 'Trop de messages ont été envoyés. Patientez une minute avant de réessayer.';
    }
    if (code === 'CAPTCHA_REQUIRED' || code === 'CAPTCHA_INVALID') {
      return 'La vérification de sécurité a échoué. Recommencez la vérification puis réessayez.';
    }
    if (code === 'CAPTCHA_UNAVAILABLE') {
      return 'La vérification de sécurité est momentanément indisponible. Réessayez dans un instant.';
    }
    if (code === 'VALIDATION_ERROR') {
      return 'Certaines informations sont invalides. Vérifiez les champs signalés puis réessayez.';
    }
    return 'Impossible d’envoyer votre message. Vérifiez votre connexion puis réessayez.';
  }

  private resetCaptcha(): void {
    if (!this.captchaEnabled()) return;
    this.form.controls.turnstileToken.reset(null);
    this.form.controls.turnstileToken.markAsPristine();
    this.form.controls.turnstileToken.markAsUntouched();
  }

  private showError(control: AbstractControl): boolean {
    return (control.touched || this.submitted()) && control.invalid;
  }

  private focusSuccessTitle(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    queueMicrotask(() => this.successTitle()?.nativeElement.focus());
  }

  private focusFirstInvalid(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    queueMicrotask(() => {
      this.formElement()
        ?.nativeElement.querySelector<HTMLElement>('[aria-invalid="true"]')
        ?.focus();
    });
  }
}
