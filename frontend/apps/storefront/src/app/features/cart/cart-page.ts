import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { debounceTime, Subject } from 'rxjs';
import { CartStore } from '../../core/cart/cart.store';
import { type CartItemValidationDto, type CartIssueDto } from '@bruny/data-access';
import { EmptyStateComponent } from '@bruny/ui';
import { CartLineItemComponent } from './components/cart-line-item/cart-line-item.component';
import { CartSummaryComponent } from './components/cart-summary/cart-summary.component';
import { CartReassuranceComponent } from './components/cart-reassurance/cart-reassurance.component';
import type { ReassurancePoint } from './components/cart-reassurance/cart-reassurance.component';
import { SeoService } from '../../core/seo.service';

@Component({
  selector: 'bruny-cart-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    EmptyStateComponent,
    CartLineItemComponent,
    CartSummaryComponent,
    CartReassuranceComponent,
  ],
  templateUrl: './cart-page.html',
  styleUrl: './cart-page.scss',
})
export class CartPage implements OnInit {
  private readonly cartStore = inject(CartStore);
  private readonly seoService = inject(SeoService);
  private readonly router = inject(Router);
  private readonly quantityChanged$ = new Subject<void>();

  readonly cart = this.cartStore;

  readonly validatedLinesMap = computed(() => {
    const validation = this.cart.validationResult();
    if (validation === null) return new Map<string, CartItemValidationDto>();
    return new Map(validation.lines.map((line) => [line.variantId, line]));
  });

  readonly issuesMap = computed(() => {
    const validation = this.cart.validationResult();
    if (validation === null) return new Map<string, CartIssueDto>();
    const map = new Map<string, CartIssueDto>();
    for (const issue of validation.issues) {
      if (issue.variantId !== undefined) map.set(issue.variantId, issue);
    }
    return map;
  });

  readonly hasBlockingIssues = computed(() => {
    const validation = this.cart.validationResult();
    if (validation === null) return false;
    const blocking = [
      'INSUFFICIENT_STOCK',
      'OUT_OF_STOCK',
      'PRODUCT_ARCHIVED',
      'PRODUCT_NOT_FOUND',
      'VARIANT_NOT_FOUND',
    ];
    return validation.issues.some((issue) => blocking.includes(issue.code));
  });

  readonly canCheckout = computed(() => !this.hasBlockingIssues() && this.cart.lines().length > 0);

  readonly reassurancePoints: ReassurancePoint[] = [
    {
      icon: 'check-circle',
      label: 'Paiement à la livraison',
      description: 'Payez une fois la paire reçue.',
    },
    {
      icon: 'refresh',
      label: 'Échange sous 7 jours',
      description: 'Pas la bonne pointure ? L’échange est possible.',
    },
    {
      icon: 'truck',
      label: 'Livraison à Douala et Yaoundé',
      description: 'Vos commandes livrées dans les villes desservies.',
    },
    {
      icon: 'whatsapp',
      label: 'Support WhatsApp',
      description: 'Une question ? Notre équipe vous répond.',
    },
  ];

  constructor() {
    this.quantityChanged$
      .pipe(debounceTime(500), takeUntilDestroyed())
      .subscribe(() => void this.cart.validate());
  }

  ngOnInit(): void {
    this.seoService.setPageMeta({
      title: 'Mon panier',
      description:
        'Vérifiez votre panier BrunyShop avant de commander. Paiement à la livraison disponible.',
    });
    if (!this.cart.isEmpty()) void this.cart.validate();
  }

  setQuantity(variantId: string, quantity: number): void {
    this.cart.updateQuantity(variantId, quantity);
    this.quantityChanged$.next();
  }

  remove(variantId: string): void {
    this.cart.removeLine(variantId);
  }

  retry(): void {
    void this.cart.validate();
  }

  goToCatalog(): void {
    void this.router.navigate(['/boutique']);
  }
}
