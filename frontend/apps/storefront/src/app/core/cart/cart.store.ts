import { isPlatformBrowser } from '@angular/common';
import { afterNextRender, computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CartApi, type CatalogProduct, type CartItemInputDto } from '@bruny/data-access';
import { ToastService } from '@bruny/core';
import {
  CART_MAX_LINE_QUANTITY,
  CART_MAX_LINES,
  CART_SNAPSHOT_VERSION,
  CART_STORAGE_KEY,
  LEGACY_CART_STORAGE_KEY,
  type CartLine,
  type CartSnapshot,
  type CartValidationIssue,
  type CartValidationResult,
  toCartValidationResult,
} from './cart.model';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== '';
}

function asNullableString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

@Injectable({ providedIn: 'root' })
export class CartStore {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly browser = isPlatformBrowser(this.platformId);
  private readonly api = inject(CartApi);
  private readonly toast = inject(ToastService);

  private readonly lineState = signal<CartLine[]>([]);
  private readonly validationState = signal<CartValidationResult | null>(null);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<string | null>(null);
  private readonly lastValidatedState = signal<string | null>(null);
  private validationRequest = 0;

  readonly lines = this.lineState.asReadonly();
  readonly validationResult = this.validationState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly lastValidatedAt = this.lastValidatedState.asReadonly();

  readonly itemCount = computed(() =>
    this.lineState().reduce((total, line) => total + line.quantity, 0),
  );
  readonly lineCount = computed(() => this.lineState().length);
  readonly isEmpty = computed(() => this.lineState().length === 0);
  readonly issues = computed<CartValidationIssue[]>(() => this.validationState()?.issues ?? []);
  readonly hasIssues = computed(() => this.issues().length > 0);

  /** Total serveur dès qu'une validation existe, sinon estimation locale. */
  readonly displayTotal = computed(() => {
    const validation = this.validationState();
    if (validation !== null) return validation.total;
    return this.lineState().reduce((sum, line) => sum + line.unitPriceAtAdd * line.quantity, 0);
  });

  readonly subtotal = computed(() => {
    const validation = this.validationState();
    if (validation !== null) return validation.subtotal;
    return this.lineState().reduce((sum, line) => sum + line.unitPriceAtAdd * line.quantity, 0);
  });

  readonly discount = computed(() => this.validationState()?.discount ?? 0);

  readonly isStale = computed(() => {
    const last = this.lastValidatedState();
    if (last === null) return true;
    return Date.now() - new Date(last).getTime() > 5 * 60 * 1000;
  });

  constructor() {
    // afterNextRender évite une divergence d'hydratation : le serveur rend le
    // panier vide, puis le navigateur restaure le snapshot après le premier
    // rendu.
    afterNextRender(() => {
      if (!this.browser) return;
      this.restoreFromStorage();
      if (!this.isEmpty()) void this.validate();
    });
  }

  addLine(line: Omit<CartLine, 'addedAt'>): void {
    if (
      !Number.isInteger(line.quantity) ||
      line.quantity < 1 ||
      line.quantity > CART_MAX_LINE_QUANTITY
    ) {
      this.toast.error('Quantité invalide (1 à 100).');
      return;
    }

    const existing = this.lineState().find((item) => item.variantId === line.variantId);
    if (existing !== undefined) {
      const quantity = Math.min(existing.quantity + line.quantity, CART_MAX_LINE_QUANTITY);
      this.replaceLines(
        this.lineState().map((item) =>
          item.variantId === line.variantId ? { ...item, quantity } : item,
        ),
      );
      this.toast.success('Quantité mise à jour.');
      return;
    }

    if (this.lineState().length >= CART_MAX_LINES) {
      this.toast.error('Votre panier est plein (50 articles maximum).');
      return;
    }

    const newLine: CartLine = { ...line, addedAt: new Date().toISOString() };
    this.replaceLines([...this.lineState(), newLine]);
    this.toast.success('Produit ajouté au panier.');
  }

  /** Ajout rapide depuis une carte produit (premier variant disponible). */
  addProduct(product: CatalogProduct): boolean {
    const variant = product.variants.find((item) => item.isAvailable && item.availableStock > 0);
    if (variant === undefined) {
      this.toast.error("Ce produit n'est pas disponible.");
      return false;
    }

    const image = product.images[0];
    this.addLine({
      variantId: variant.id,
      productId: product.id,
      productSlug: product.slug,
      productName: product.name,
      variantSku: variant.sku,
      size: variant.size,
      color: variant.color,
      quantity: 1,
      unitPriceAtAdd: product.effectivePrice,
      imageUrl: image?.url ?? null,
      imageAlt: image?.alt ?? product.name,
    });
    return true;
  }

  updateQuantity(variantId: string, quantity: number): void {
    if (!Number.isFinite(quantity)) return;
    if (quantity < 1) {
      this.removeLine(variantId);
      return;
    }
    const nextQuantity = Math.min(Math.floor(quantity), CART_MAX_LINE_QUANTITY);
    if (!this.lineState().some((line) => line.variantId === variantId)) return;

    this.replaceLines(
      this.lineState().map((line) =>
        line.variantId === variantId ? { ...line, quantity: nextQuantity } : line,
      ),
    );
  }

  removeLine(variantId: string): void {
    if (!this.lineState().some((line) => line.variantId === variantId)) return;
    this.replaceLines(this.lineState().filter((line) => line.variantId !== variantId));
    this.toast.warning('Produit retiré du panier.');
  }

  clear(): void {
    this.replaceLines([]);
    this.validationState.set(null);
    this.lastValidatedState.set(null);
    this.errorState.set(null);
  }

  /**
   * Revalide le panier auprès de CRT-01. Retourne null au SSR, pour un panier
   * vide, ou si une validation plus récente a pris le relais.
   */
  async validate(): Promise<CartValidationResult | null> {
    if (!this.browser) return null;

    const lines = this.lineState();
    if (lines.length === 0) {
      // Après une validation qui a retiré toutes les lignes (rupture), les
      // issues doivent rester visibles. Un panier vidé par l'utilisateur passe
      // par replaceLines(), qui les efface déjà.
      if (!this.hasIssues()) this.validationState.set(null);
      this.errorState.set(null);
      return null;
    }

    const request = ++this.validationRequest;
    this.loadingState.set(true);
    this.errorState.set(null);

    const items: CartItemInputDto[] = lines.map((line) => ({
      variantId: line.variantId,
      quantity: line.quantity,
      previousUnitPrice: line.unitPriceAtAdd,
    }));

    try {
      const response = await firstValueFrom(this.api.validate({ items }));
      if (request !== this.validationRequest) return null;

      const result = toCartValidationResult(response);
      this.displayIssues(result.issues);
      this.syncLinesFromValidation(result);
      this.validationState.set(result);
      this.lastValidatedState.set(result.validatedAt);
      return result;
    } catch {
      if (request !== this.validationRequest) return null;
      this.errorState.set('Impossible de vérifier votre panier. Vérifiez votre connexion.');
      return null;
    } finally {
      if (request === this.validationRequest) this.loadingState.set(false);
    }
  }

  lineTotal(variantId: string): number {
    const validated = this.validationState()?.lines.find((line) => line.variantId === variantId);
    if (validated !== undefined) return validated.lineTotal;
    const line = this.lineState().find((item) => item.variantId === variantId);
    return line === undefined ? 0 : line.unitPriceAtAdd * line.quantity;
  }

  private replaceLines(lines: CartLine[]): void {
    this.lineState.set(lines);
    // Une modification locale rend le dernier total serveur obsolète : on
    // revient à l'estimation locale jusqu'à la prochaine validation.
    this.validationState.set(null);
    this.lastValidatedState.set(null);
    this.errorState.set(null);
    this.persist();
  }

  /**
   * Aligne les quantités et les prix mémorisés sur la réponse serveur. Les
   * lignes retirées (quantité 0, variante supprimée) disparaissent du panier.
   */
  private syncLinesFromValidation(result: CartValidationResult): void {
    const validated = new Map(result.lines.map((line) => [line.variantId, line]));
    let changed = false;

    const next = this.lineState().flatMap((line) => {
      const serverLine = validated.get(line.variantId);
      if (serverLine === undefined || serverLine.quantity < 1) {
        changed = true;
        return [];
      }
      if (serverLine.quantity !== line.quantity || serverLine.unitPrice !== line.unitPriceAtAdd) {
        changed = true;
        return [
          {
            ...line,
            quantity: serverLine.quantity,
            unitPriceAtAdd: serverLine.unitPrice,
          },
        ];
      }
      return [line];
    });

    if (!changed) return;
    this.lineState.set(next);
    this.persist();
  }

  private displayIssues(issues: CartValidationIssue[]): void {
    for (const issue of issues) {
      const message = issue.message.trim();
      if (message === '') continue;

      switch (issue.code) {
        case 'PROMO_APPLIED':
          this.toast.success(message);
          break;
        case 'PROMO_EXPIRED':
        case 'COUPON_MIN_AMOUNT_NOT_REACHED':
          this.toast.info(message);
          break;
        case 'COUPON_INVALID':
          this.toast.error(message);
          break;
        default:
          this.toast.warning(message);
          break;
      }
    }
  }

  private persist(): void {
    if (!this.browser) return;
    try {
      const snapshot: CartSnapshot = {
        version: CART_SNAPSHOT_VERSION,
        lines: this.lineState(),
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(snapshot));
    } catch {
      // Quota dépassé ou stockage refusé : le panier reste utilisable en mémoire.
    }
  }

  private restoreFromStorage(): void {
    if (!this.browser) return;

    const current = this.readSnapshot(CART_STORAGE_KEY);
    const legacy = current === null ? this.readLegacy() : null;
    const lines = current ?? legacy;
    this.lineState.set(lines ?? []);
  }

  private readSnapshot(key: string): CartLine[] | null {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return null;

      const parsed: unknown = JSON.parse(raw);
      if (!isRecord(parsed) || parsed['version'] !== CART_SNAPSHOT_VERSION) {
        localStorage.removeItem(key);
        return null;
      }

      const value = parsed['lines'];
      if (!Array.isArray(value)) {
        localStorage.removeItem(key);
        return null;
      }
      return this.sanitizeLines(value);
    } catch {
      localStorage.removeItem(key);
      return null;
    }
  }

  private readLegacy(): CartLine[] | null {
    try {
      const raw = localStorage.getItem(LEGACY_CART_STORAGE_KEY);
      if (raw === null) return null;

      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        localStorage.removeItem(LEGACY_CART_STORAGE_KEY);
        return null;
      }

      const now = new Date().toISOString();
      const lines = parsed.flatMap((value): CartLine[] => {
        if (!isRecord(value)) return [];
        if (
          !isNonEmptyString(value['variantId']) ||
          !isNonEmptyString(value['productId']) ||
          !isNonEmptyString(value['name']) ||
          !isNonEmptyString(value['slug']) ||
          typeof value['quantity'] !== 'number' ||
          typeof value['unitPrice'] !== 'number'
        ) {
          return [];
        }
        const quantity = Math.floor(value['quantity']);
        if (quantity < 1 || quantity > CART_MAX_LINE_QUANTITY) return [];
        return [
          {
            variantId: value['variantId'],
            productId: value['productId'],
            productSlug: value['slug'],
            productName: value['name'],
            variantSku: '',
            size: typeof value['size'] === 'string' ? value['size'] : '',
            color: typeof value['color'] === 'string' ? value['color'] : '',
            quantity,
            unitPriceAtAdd: value['unitPrice'],
            imageUrl: asNullableString(value['image']),
            imageAlt: null,
            addedAt: now,
          },
        ];
      });

      localStorage.removeItem(LEGACY_CART_STORAGE_KEY);
      if (lines.length === 0) return null;
      this.lineState.set(lines.slice(0, CART_MAX_LINES));
      this.persist();
      return lines.slice(0, CART_MAX_LINES);
    } catch {
      localStorage.removeItem(LEGACY_CART_STORAGE_KEY);
      return null;
    }
  }

  private sanitizeLines(values: unknown[]): CartLine[] {
    const lines: CartLine[] = [];
    const seen = new Set<string>();

    for (const value of values) {
      if (lines.length >= CART_MAX_LINES) break;
      if (!isRecord(value)) continue;
      if (
        !isNonEmptyString(value['variantId']) ||
        !isNonEmptyString(value['productId']) ||
        !isNonEmptyString(value['productSlug']) ||
        !isNonEmptyString(value['productName']) ||
        typeof value['quantity'] !== 'number' ||
        !Number.isFinite(value['quantity']) ||
        typeof value['unitPriceAtAdd'] !== 'number' ||
        !Number.isFinite(value['unitPriceAtAdd']) ||
        value['unitPriceAtAdd'] < 0
      ) {
        continue;
      }

      const quantity = Math.floor(value['quantity']);
      const variantId = value['variantId'];
      if (quantity < 1 || quantity > CART_MAX_LINE_QUANTITY || seen.has(variantId)) {
        continue;
      }
      seen.add(variantId);

      lines.push({
        variantId,
        productId: value['productId'],
        productSlug: value['productSlug'],
        productName: value['productName'],
        variantSku: typeof value['variantSku'] === 'string' ? value['variantSku'] : '',
        size: typeof value['size'] === 'string' ? value['size'] : '',
        color: typeof value['color'] === 'string' ? value['color'] : '',
        quantity,
        unitPriceAtAdd: value['unitPriceAtAdd'],
        imageUrl: asNullableString(value['imageUrl']),
        imageAlt: asNullableString(value['imageAlt']),
        addedAt: isNonEmptyString(value['addedAt']) ? value['addedAt'] : new Date().toISOString(),
      });
    }

    return lines;
  }
}
