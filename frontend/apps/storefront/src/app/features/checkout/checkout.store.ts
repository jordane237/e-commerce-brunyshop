import { isPlatformBrowser } from '@angular/common';
import { afterNextRender, computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { readApiError, ToastService } from '@bruny/core';
import { CartStore } from '../../core/cart/cart.store';
import type { CartLine } from '../../core/cart/cart.model';
import {
  OrdersApi,
  ShippingApi,
  type CreateOrderResponse,
  type DeliveryZoneDto,
} from '@bruny/data-access';

import {
  CHECKOUT_DRAFT_VERSION,
  CHECKOUT_STORAGE_KEY,
  type CheckoutContact,
  type CheckoutDelivery,
  type CheckoutDraft,
  type CheckoutPayment,
  type CheckoutStep,
  createIdempotencyKey,
  isContactValid,
  isDeliveryValid,
  sanitizeCheckoutDraft,
  toOrderPhone,
} from './checkout.model';

interface CheckoutPayload {
  fingerprint: string;
}

@Injectable({ providedIn: 'root' })
export class CheckoutStore {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly browser = isPlatformBrowser(this.platformId);
  readonly cart = inject(CartStore);
  private readonly ordersApi = inject(OrdersApi);
  private readonly shippingApi = inject(ShippingApi);
  private readonly toast = inject(ToastService);

  private readonly stepState = signal<CheckoutStep>(1);
  private readonly contactState = signal<CheckoutContact>({ fullName: '', phone: '', email: '' });
  private readonly deliveryState = signal<CheckoutDelivery>({
    city: '',
    district: '',
    landmark: '',
    zoneId: null,
  });
  private readonly paymentState = signal<CheckoutPayment>({
    method: 'COD',
    termsAccepted: false,
  });
  private readonly idempotencyKeyState = signal(createIdempotencyKey());
  private readonly lastPayloadState = signal<CheckoutPayload | null>(null);

  private readonly zonesState = signal<DeliveryZoneDto[]>([]);
  private readonly zonesLoadingState = signal(false);
  private readonly zonesErrorState = signal<string | null>(null);
  private readonly submittingState = signal(false);
  private readonly submitErrorState = signal<string | null>(null);
  private readonly orderState = signal<CreateOrderResponse | null>(null);
  private readonly submittedItemsState = signal<CartLine[]>([]);

  readonly step = this.stepState.asReadonly();
  readonly contact = this.contactState.asReadonly();
  readonly delivery = this.deliveryState.asReadonly();
  readonly payment = this.paymentState.asReadonly();
  readonly zones = this.zonesState.asReadonly();
  readonly zonesLoading = this.zonesLoadingState.asReadonly();
  readonly zonesError = this.zonesErrorState.asReadonly();
  readonly submitting = this.submittingState.asReadonly();
  readonly submitError = this.submitErrorState.asReadonly();
  readonly order = this.orderState.asReadonly();
  readonly submittedItems = this.submittedItemsState.asReadonly();

  readonly selectedZone = computed(() => {
    const zoneId = this.deliveryState().zoneId;
    if (zoneId === null) return null;
    return this.zonesState().find((zone) => zone.id === zoneId) ?? null;
  });

  readonly shippingFee = computed(() => this.selectedZone()?.fee ?? null);

  readonly subtotal = computed(() => this.cart.subtotal());

  readonly discount = computed(() => this.cart.discount());

  /** Total affiché : estimations serveur du panier + frais de la zone choisie. */
  readonly total = computed(() => {
    const fee = this.shippingFee() ?? 0;
    return Math.max(0, this.subtotal() - this.discount()) + fee;
  });

  readonly contactValid = computed(() => isContactValid(this.contactState()));

  readonly deliveryValid = computed(() => isDeliveryValid(this.deliveryState()));

  readonly canSubmit = computed(
    () =>
      this.contactValid() &&
      this.deliveryValid() &&
      this.paymentState().method === 'COD' &&
      this.paymentState().termsAccepted &&
      !this.submittingState() &&
      this.cart.lines().length > 0,
  );

  constructor() {
    afterNextRender(() => {
      if (!this.browser) return;
      this.restoreDraft();
      if (!this.cart.isEmpty()) void this.cart.validate();
      if (this.stepState() >= 2) void this.loadZones();
    });
  }

  setContact(patch: Partial<CheckoutContact>): void {
    this.contactState.update((current) => ({ ...current, ...patch }));
    this.persist();
  }

  setDelivery(patch: Partial<CheckoutDelivery>): void {
    this.deliveryState.update((current) => ({ ...current, ...patch }));
    this.persist();
  }

  selectZone(zoneId: string): void {
    this.deliveryState.update((current) => ({ ...current, zoneId }));
    this.persist();
  }

  setPayment(patch: Partial<CheckoutPayment>): void {
    this.paymentState.update((current) => ({ ...current, ...patch }));
    this.persist();
  }

  goToStep(step: CheckoutStep): void {
    if (step > this.stepState()) return;
    this.stepState.set(step);
    this.persist();
  }

  next(): boolean {
    const step = this.stepState();
    if (step === 1 && !this.contactValid()) return false;
    if (step === 2 && !this.deliveryValid()) return false;
    if (step < 3) {
      this.stepState.set((step + 1) as CheckoutStep);
      this.persist();
      if (step === 1 && this.zonesState().length === 0) void this.loadZones();
    }
    return true;
  }

  back(): void {
    const step = this.stepState();
    if (step > 1) {
      this.stepState.set((step - 1) as CheckoutStep);
      this.persist();
    }
  }

  async loadZones(): Promise<void> {
    if (this.zonesLoadingState()) return;
    this.zonesLoadingState.set(true);
    this.zonesErrorState.set(null);
    try {
      const zones = await firstValueFrom(this.shippingApi.getZones());
      this.zonesState.set(zones);
      const selected = this.deliveryState().zoneId;
      if (selected !== null && !zones.some((zone) => zone.id === selected)) {
        this.deliveryState.update((current) => ({ ...current, zoneId: null }));
        this.persist();
      }
    } catch {
      this.zonesErrorState.set(
        'Impossible de charger les modes de livraison. Vérifiez votre connexion puis réessayez.',
      );
    } finally {
      this.zonesLoadingState.set(false);
    }
  }

  /**
   * Envoie la commande à ORD-01.
   *
   * La clé d'idempotence reste identique tant que le contenu envoyé ne change
   * pas : un simple réessai renvoie donc la même commande au lieu d'en créer
   * une seconde. Toute modification des données régénère la clé.
   */
  async submit(turnstileToken: string | null): Promise<CreateOrderResponse | null> {
    if (this.submittingState() || this.orderState() !== null) return null;
    if (!this.canSubmit()) {
      this.submitErrorState.set('Vérifiez vos informations avant de confirmer la commande.');
      return null;
    }

    const payload = this.buildPayload(turnstileToken);
    const fingerprint = JSON.stringify(payload);
    if (this.lastPayloadState()?.fingerprint !== fingerprint) {
      this.idempotencyKeyState.set(createIdempotencyKey());
      this.lastPayloadState.set({ fingerprint });
      this.persist();
    }

    this.submittingState.set(true);
    this.submitErrorState.set(null);
    try {
      const order = await firstValueFrom(
        this.ordersApi.create(payload, this.idempotencyKeyState()),
      );
      this.submittedItemsState.set(this.cart.lines());
      this.orderState.set(order);
      this.cart.clear();
      this.clearDraftStorage();
      this.toast.success(`Commande ${order.reference} confirmée.`);
      return order;
    } catch (error) {
      this.submitErrorState.set(this.submitErrorMessage(error));
      return null;
    } finally {
      this.submittingState.set(false);
    }
  }

  private buildPayload(turnstileToken: string | null): Parameters<OrdersApi['create']>[0] {
    const contact = this.contactState();
    const delivery = this.deliveryState();
    const phone = toOrderPhone(contact.phone);
    const landmark = delivery.landmark.trim();

    return {
      items: this.cart.lines().map((line) => ({
        variantId: line.variantId,
        quantity: line.quantity,
      })),
      guestName: contact.fullName.trim(),
      guestPhone: phone,
      address: {
        recipientName: contact.fullName.trim(),
        phone,
        city: delivery.city.trim(),
        district: delivery.district.trim(),
        // ORD-01 exige une ligne d'adresse : le point de repère en tient lieu
        // tant que le carnet d'adresses (ACC-04) n'existe pas.
        line: landmark,
        landmark,
      },
      // On transmet la zone du brouillon : le serveur revérifie ses frais,
      // même si la liste des zones n'a pas pu être rechargée.
      ...(delivery.zoneId !== null ? { deliveryZoneId: delivery.zoneId } : {}),
      paymentMethod: 'COD',
      ...(turnstileToken !== null ? { turnstileToken } : {}),
    };
  }

  private submitErrorMessage(error: unknown): string {
    const code = readApiError(error)?.code;
    switch (code) {
      case 'INSUFFICIENT_STOCK':
      case 'OUT_OF_STOCK':
        return 'Un article de votre panier n’est plus disponible. Vérifiez votre panier puis réessayez.';
      case 'PRODUCT_ARCHIVED':
      case 'PRODUCT_NOT_FOUND':
      case 'VARIANT_NOT_FOUND':
        return 'Un article de votre panier n’est plus vendu. Retirez-le avant de commander.';
      case 'IDEMPOTENCY_CONFLICT':
        return 'Cette tentative de commande a déjà été utilisée avec d’autres informations. Recommencez la commande.';
      case 'CAPTCHA_REQUIRED':
      case 'CAPTCHA_INVALID':
        return 'La vérification de sécurité a échoué. Réessayez.';
      case 'CAPTCHA_UNAVAILABLE':
        return 'La vérification de sécurité est momentanément indisponible. Réessayez dans un instant.';
      case 'RATE_LIMIT_EXCEEDED':
      case 'ORDER_RATE_LIMIT_EXCEEDED':
      case 'TOO_MANY_ATTEMPTS':
        return 'Trop de tentatives. Patientez une minute avant de réessayer.';
      case 'VALIDATION_ERROR':
        return 'Certaines informations sont invalides. Vérifiez vos coordonnées et votre adresse.';
      case 'DELIVERY_ZONE_NOT_FOUND':
        return 'Le mode de livraison choisi n’est plus disponible. Sélectionnez-en un autre.';
      default:
        return 'Impossible d’envoyer votre commande. Vérifiez votre connexion puis réessayez.';
    }
  }

  private restoreDraft(): void {
    const draft = this.readDraft();
    if (draft === null) return;
    this.stepState.set(draft.step);
    this.contactState.set(draft.contact);
    this.deliveryState.set(draft.delivery);
    this.paymentState.set(draft.payment);
    this.idempotencyKeyState.set(draft.idempotencyKey);
  }

  private readDraft(): CheckoutDraft | null {
    try {
      const raw = localStorage.getItem(CHECKOUT_STORAGE_KEY);
      if (raw === null) return null;
      const draft = sanitizeCheckoutDraft(JSON.parse(raw) as unknown);
      if (draft === null) localStorage.removeItem(CHECKOUT_STORAGE_KEY);
      return draft;
    } catch {
      localStorage.removeItem(CHECKOUT_STORAGE_KEY);
      return null;
    }
  }

  private persist(): void {
    if (!this.browser || this.orderState() !== null) return;
    try {
      const draft: CheckoutDraft = {
        version: CHECKOUT_DRAFT_VERSION,
        step: this.stepState(),
        contact: this.contactState(),
        delivery: this.deliveryState(),
        payment: this.paymentState(),
        idempotencyKey: this.idempotencyKeyState(),
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(draft));
    } catch {
      // Stockage refusé ou plein : le tunnel reste utilisable en mémoire.
    }
  }

  private clearDraftStorage(): void {
    if (!this.browser) return;
    try {
      localStorage.removeItem(CHECKOUT_STORAGE_KEY);
    } catch {
      // Rien à faire : le brouillon n'a plus d'utilité après la commande.
    }
  }
}
