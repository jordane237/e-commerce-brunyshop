import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  PLATFORM_ID,
  afterNextRender,
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
import { Router, RouterLink } from '@angular/router';

import { PublicConfigService } from '@bruny/data-access';
import {
  ButtonComponent,
  CaptchaComponent,
  CgvCheckboxComponent,
  EmptyStateComponent,
  InputComponent,
  RadioComponent,
} from '@bruny/ui';
import { FcfaPipe } from '@bruny/util';

import { SeoService } from '../../core/seo.service';
import { CheckoutStore } from './checkout.store';
import {
  CHECKOUT_CITY_MAX_LENGTH,
  CHECKOUT_DISTRICT_MAX_LENGTH,
  CHECKOUT_LANDMARK_MAX_LENGTH,
  checkoutPhoneFieldValidator,
  fullNameFieldValidator,
  optionalEmailFieldValidator,
  validateOptionalEmail,
  validateCheckoutPhone,
  validateFullName,
  validateRequiredText,
  type CheckoutStep,
} from './checkout.model';
import { CheckoutRecapComponent } from './components/checkout-recap/checkout-recap.component';

type ContactForm = FormGroup<{
  fullName: FormControl<string>;
  phone: FormControl<string>;
  email: FormControl<string>;
}>;

type DeliveryForm = FormGroup<{
  city: FormControl<string>;
  district: FormControl<string>;
  landmark: FormControl<string>;
}>;

type PaymentForm = FormGroup<{
  method: FormControl<'COD' | 'MOBILE_MONEY'>;
  termsAccepted: FormControl<boolean>;
  turnstileToken: FormControl<string | null>;
}>;

@Component({
  selector: 'app-checkout-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    ButtonComponent,
    CaptchaComponent,
    CgvCheckboxComponent,
    EmptyStateComponent,
    InputComponent,
    RadioComponent,
    CheckoutRecapComponent,
    FcfaPipe,
  ],
  templateUrl: './checkout-page.html',
  styleUrl: './checkout-page.scss',
})
export class CheckoutPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);
  private readonly seo = inject(SeoService);
  private readonly publicConfig = inject(PublicConfigService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly formElement = viewChild<ElementRef<HTMLElement>>('checkoutForm');

  readonly checkout = inject(CheckoutStore);

  readonly submitted = signal(false);
  readonly captchaEnabled = signal(false);
  readonly captchaUnavailable = signal(false);
  readonly siteKey = signal<string | null>(null);

  readonly steps: ReadonlyArray<{ step: CheckoutStep; label: string; shortLabel: string }> = [
    { step: 1, label: 'Coordonnées', shortLabel: '1' },
    { step: 2, label: 'Livraison', shortLabel: '2' },
    { step: 3, label: 'Paiement', shortLabel: '3' },
  ];

  readonly contactForm: ContactForm = this.fb.group({
    fullName: this.fb.control('', {
      validators: [Validators.required, fullNameFieldValidator],
    }),
    phone: this.fb.control('', {
      validators: [Validators.required, checkoutPhoneFieldValidator],
    }),
    email: this.fb.control('', { validators: [optionalEmailFieldValidator] }),
  });

  readonly deliveryForm: DeliveryForm = this.fb.group({
    city: this.fb.control('', {
      validators: [Validators.required, Validators.maxLength(CHECKOUT_CITY_MAX_LENGTH)],
    }),
    district: this.fb.control('', {
      validators: [Validators.required, Validators.maxLength(CHECKOUT_DISTRICT_MAX_LENGTH)],
    }),
    landmark: this.fb.control('', {
      validators: [Validators.required, Validators.maxLength(CHECKOUT_LANDMARK_MAX_LENGTH)],
    }),
  });

  readonly paymentForm: PaymentForm = this.fb.group({
    method: this.fb.control<'COD' | 'MOBILE_MONEY'>('COD'),
    termsAccepted: this.fb.control(false, { validators: [Validators.requiredTrue] }),
    turnstileToken: new FormControl<string | null>(null),
  });

  readonly recapLines = this.checkout.cart.lines;

  readonly order = this.checkout.order;

  readonly subtotal = computed(() => this.checkout.subtotal());
  readonly total = computed(() => this.checkout.total());
  readonly shippingFee = computed(() => this.checkout.shippingFee());
  readonly zoneName = computed(() => this.checkout.selectedZone()?.name ?? null);
  readonly zoneDays = computed(() => this.checkout.selectedZone()?.estimatedDays ?? null);
  readonly cartEmpty = computed(() => this.checkout.cart.isEmpty() && this.order() === null);

  constructor() {
    this.seo.setPageMeta({
      title: 'Commander',
      description:
        'Finalisez votre commande BrunyShop en trois étapes : coordonnées, livraison et paiement à la livraison.',
      canonicalPath: '/commande',
      noIndex: true,
    });

    this.restoreForms();
    this.syncFormsToStore();
    this.loadCaptchaConfig();
    // Le brouillon est relu par le store au premier rendu navigateur : on
    // réapplique ensuite les valeurs restaurées aux formulaires.
    afterNextRender(() => this.restoreForms());
  }

  private restoreForms(): void {
    const contact = this.checkout.contact();
    this.contactForm.setValue(
      { fullName: contact.fullName, phone: contact.phone, email: contact.email },
      { emitEvent: false },
    );

    const delivery = this.checkout.delivery();
    this.deliveryForm.setValue(
      { city: delivery.city, district: delivery.district, landmark: delivery.landmark },
      { emitEvent: false },
    );

    const payment = this.checkout.payment();
    this.paymentForm.controls.termsAccepted.setValue(payment.termsAccepted, { emitEvent: false });
  }

  private syncFormsToStore(): void {
    this.contactForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => this.checkout.setContact(value));
    this.deliveryForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => this.checkout.setDelivery(value));
    this.paymentForm.controls.termsAccepted.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((termsAccepted) => this.checkout.setPayment({ termsAccepted }));
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
            return;
          }
          this.siteKey.set(config.turnstileSiteKey);
          this.captchaEnabled.set(true);
          this.paymentForm.controls.turnstileToken.setValidators([Validators.required]);
          this.paymentForm.controls.turnstileToken.updateValueAndValidity();
        },
        error: () => this.captchaUnavailable.set(true),
      });
  }

  stepLabel(step: CheckoutStep): string {
    return this.steps.find((item) => item.step === step)?.label ?? '';
  }

  goToStep(step: CheckoutStep): void {
    if (step < this.checkout.step()) this.checkout.goToStep(step);
  }

  onContinue(): void {
    const step = this.checkout.step();
    if (step === 1) {
      this.contactForm.markAllAsTouched();
      if (this.contactForm.invalid) {
        this.focusFirstInvalid();
        return;
      }
      this.checkout.setContact(this.contactForm.getRawValue());
    }
    if (step === 2) {
      this.deliveryForm.markAllAsTouched();
      if (this.deliveryForm.invalid) {
        this.focusFirstInvalid();
        return;
      }
      if (this.checkout.delivery().zoneId === null) {
        this.checkout.loadZones();
        return;
      }
      this.checkout.setDelivery(this.deliveryForm.getRawValue());
    }
    this.submitted.set(false);
    if (!this.checkout.next()) this.focusFirstInvalid();
  }

  onBack(): void {
    this.checkout.back();
  }

  selectZone(zoneId: string): void {
    this.checkout.selectZone(zoneId);
  }

  retryZones(): void {
    void this.checkout.loadZones();
  }

  selectPayment(method: 'COD' | 'MOBILE_MONEY'): void {
    // MOBILE_MONEY reste présenté « Bientôt » : aucune transaction n'est simulée.
    if (method !== 'COD') return;
    this.paymentForm.controls.method.setValue(method);
    this.checkout.setPayment({ method });
  }

  onSubmit(): void {
    if (this.checkout.submitting()) return;
    this.submitted.set(true);

    this.contactForm.markAllAsTouched();
    this.deliveryForm.markAllAsTouched();
    this.paymentForm.markAllAsTouched();

    if (
      this.contactForm.invalid ||
      this.deliveryForm.invalid ||
      this.paymentForm.invalid ||
      this.checkout.delivery().zoneId === null
    ) {
      this.focusFirstInvalid();
      return;
    }

    this.checkout.setContact(this.contactForm.getRawValue());
    this.checkout.setDelivery(this.deliveryForm.getRawValue());
    this.checkout.setPayment({
      method: 'COD',
      termsAccepted: this.paymentForm.controls.termsAccepted.value,
    });

    void this.checkout.submit(this.paymentForm.controls.turnstileToken.value);
  }

  goToCatalog(): void {
    void this.router.navigate(['/boutique']);
  }

  goToCart(): void {
    void this.router.navigate(['/panier']);
  }

  fullNameError(): string | null {
    const control = this.contactForm.controls.fullName;
    if (!control.touched && !this.submitted()) return null;
    return validateFullName(control.value);
  }

  phoneError(): string | null {
    const control = this.contactForm.controls.phone;
    if (!control.touched && !this.submitted()) return null;
    return validateCheckoutPhone(control.value);
  }

  emailError(): string | null {
    const control = this.contactForm.controls.email;
    if (!control.touched && !this.submitted()) return null;
    return validateOptionalEmail(control.value);
  }

  cityError(): string | null {
    const control = this.deliveryForm.controls.city;
    if (!control.touched && !this.submitted()) return null;
    return validateRequiredText(control.value, 'Indiquez votre ville.', CHECKOUT_CITY_MAX_LENGTH);
  }

  districtError(): string | null {
    const control = this.deliveryForm.controls.district;
    if (!control.touched && !this.submitted()) return null;
    return validateRequiredText(
      control.value,
      'Indiquez votre quartier.',
      CHECKOUT_DISTRICT_MAX_LENGTH,
    );
  }

  landmarkError(): string | null {
    const control = this.deliveryForm.controls.landmark;
    if (!control.touched && !this.submitted()) return null;
    return validateRequiredText(
      control.value,
      'Indiquez un point de repère pour le livreur.',
      CHECKOUT_LANDMARK_MAX_LENGTH,
    );
  }

  zoneError(): string | null {
    if (this.checkout.delivery().zoneId !== null) return null;
    if (!this.submitted() && this.checkout.step() !== 2) return null;
    return 'Sélectionnez un mode de livraison.';
  }

  termsError(): string | null {
    const control = this.paymentForm.controls.termsAccepted;
    if (!this.submitted() && !control.touched) return null;
    return control.value ? null : 'Acceptez les conditions générales pour commander.';
  }

  private focusFirstInvalid(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    queueMicrotask(() => {
      this.formElement()
        ?.nativeElement.querySelector<HTMLElement>('[aria-invalid="true"], [data-invalid="true"]')
        ?.focus();
    });
  }
}
