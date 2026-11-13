import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { debounceTime, Subject } from 'rxjs';
import { CartStore } from '../../core/cart/cart.store';
import { FcfaPipe } from '@bruny/util';
import { IconComponent } from '@bruny/ui';

@Component({
  selector: 'bruny-cart-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, FcfaPipe, IconComponent],
  templateUrl: './cart-page.html',
  styleUrl: './cart-page.scss',
})
export class CartPage implements OnInit {
  readonly cart = inject(CartStore);
  private readonly quantityChanged$ = new Subject<void>();

  constructor() {
    this.quantityChanged$
      .pipe(debounceTime(500), takeUntilDestroyed())
      .subscribe(() => void this.cart.validate());
  }

  ngOnInit(): void {
    // Le store ignore l'appel au SSR et lors d'un panier vide.
    void this.cart.validate();
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
}
