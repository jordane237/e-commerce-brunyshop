import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  ButtonComponent,
  DrawerComponent,
  IconComponent,
  PriceTagComponent,
  SkeletonComponent,
} from '@bruny/ui';
import { CartStore } from '../../../core/cart/cart.store';

@Component({
  selector: 'bruny-mini-cart',
  standalone: true,
  imports: [
    RouterLink,
    ButtonComponent,
    DrawerComponent,
    IconComponent,
    PriceTagComponent,
    SkeletonComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mini-cart.component.html',
  styleUrl: './mini-cart.component.scss',
})
export class MiniCartComponent {
  readonly cart = inject(CartStore);
  readonly open = signal(false);
  private readonly router = inject(Router);

  readonly itemLabel = computed(() => {
    const count = this.cart.itemCount();
    return `${count} article${count > 1 ? 's' : ''}`;
  });
  readonly announcement = computed(() => `${this.itemLabel()} dans le panier.`);

  constructor() {
    // lastAddedAt ne change qu'après un ajout réussi. On ne lit pas `open`
    // dans l'effet : fermer le tiroir ne doit pas le rouvrir.
    effect(() => {
      const lastAdded = this.cart.lastAddedAt();
      if (lastAdded === null) return;
      untracked(() => this.show());
    });
  }

  toggle(): void {
    if (this.open()) this.close();
    else this.show();
  }

  show(): void {
    this.open.set(true);
    if (this.cart.isStale() || this.cart.error() !== null) {
      void this.cart.validate();
    }
  }

  close(): void {
    this.open.set(false);
  }

  continueShopping(): void {
    this.close();
    void this.router.navigate(['/boutique']);
  }

  remove(variantId: string): void {
    this.cart.removeLine(variantId);
  }

  retry(): void {
    void this.cart.validate();
  }
}
