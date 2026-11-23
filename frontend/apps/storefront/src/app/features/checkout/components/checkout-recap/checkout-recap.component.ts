import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import type { CartLine } from '../../../../core/cart/cart.model';
import { FcfaPipe } from '@bruny/util';
import { SkeletonComponent } from '@bruny/ui';

/** Récapitulatif compact réutilisé sur les trois étapes du tunnel (ORD-03). */
@Component({
  selector: 'app-checkout-recap',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FcfaPipe, SkeletonComponent],
  templateUrl: './checkout-recap.component.html',
  styleUrl: './checkout-recap.component.scss',
})
export class CheckoutRecapComponent {
  readonly lines = input.required<CartLine[]>();
  readonly subtotal = input.required<number>();
  readonly discount = input<number>(0);
  readonly shippingFee = input<number | null>(null);
  readonly total = input.required<number>();
  readonly zoneName = input<string | null>(null);
  readonly zoneDays = input<number | null>(null);
  readonly loading = input<boolean>(false);
  readonly compact = input<boolean>(false);

  readonly itemCount = computed(() =>
    this.lines().reduce((count, line) => count + line.quantity, 0),
  );

  readonly visibleLines = computed(() =>
    this.compact() ? this.lines().slice(0, 3) : this.lines(),
  );

  readonly hiddenCount = computed(() => this.lines().length - this.visibleLines().length);
}
