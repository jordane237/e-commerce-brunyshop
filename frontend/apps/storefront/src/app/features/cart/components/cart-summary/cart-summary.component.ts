import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
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
  private readonly router = inject(Router);

  readonly subtotal = input.required<number>();
  readonly discount = input<number>(0);
  readonly shippingFee = input<number | null>(null);
  readonly total = input.required<number>();
  readonly loading = input<boolean>(false);
  readonly canCheckout = input<boolean>(true);

  goToCheckout(): void {
    if (!this.canCheckout()) return;
    void this.router.navigate(['/commande']);
  }
}
