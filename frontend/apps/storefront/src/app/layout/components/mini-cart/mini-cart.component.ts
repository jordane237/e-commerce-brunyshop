import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartStore } from '../../../core/cart/cart.store';
import { FcfaPipe } from '@bruny/util';
import { IconComponent, ModalComponent } from '@bruny/ui';

@Component({
  selector: 'bruny-mini-cart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, FcfaPipe, IconComponent, ModalComponent],
  templateUrl: './mini-cart.component.html',
  styleUrl: './mini-cart.component.scss',
})
export class MiniCartComponent {
  readonly cart = inject(CartStore);
  readonly open = signal(false);

  toggle(): void {
    const next = !this.open();
    this.open.set(next);
    if (next && (this.cart.isStale() || this.cart.error() !== null)) {
      void this.cart.validate();
    }
  }

  close(): void {
    this.open.set(false);
  }

  remove(variantId: string): void {
    this.cart.removeLine(variantId);
  }

  retry(): void {
    void this.cart.validate();
  }
}
