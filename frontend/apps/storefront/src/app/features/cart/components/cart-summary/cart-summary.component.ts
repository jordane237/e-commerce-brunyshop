import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FcfaPipe } from '@bruny/util';
import { ButtonComponent, SkeletonComponent } from '@bruny/ui';

@Component({
  selector: 'app-cart-summary',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FcfaPipe, ButtonComponent, RouterLink, SkeletonComponent],
  templateUrl: './cart-summary.component.html',
  styleUrl: './cart-summary.component.scss',
})
export class CartSummaryComponent {
  readonly subtotal = input.required<number>();
  readonly discount = input<number>(0);
  readonly shippingFee = input<number | null>(null);
  readonly total = input.required<number>();
  readonly loading = input<boolean>(false);
  readonly canCheckout = input<boolean>(true);
  /** La page de commande (DSG-04) n'existe pas encore : le CTA reste désactivé. */
  readonly checkoutAvailable = input<boolean>(false);
}
