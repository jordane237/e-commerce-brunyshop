import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ButtonComponent, IconComponent, PriceTagComponent } from '@bruny/ui';

@Component({
  selector: 'app-sticky-buy-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent, IconComponent, PriceTagComponent],
  templateUrl: './sticky-buy-bar.component.html',
  styleUrl: './sticky-buy-bar.component.scss',
})
export class StickyBuyBarComponent {
  readonly effectivePrice = input.required<number>();
  readonly originalPrice = input<number | null>(null);
  readonly canAddToCart = input.required<boolean>();
  readonly addToCartMessage = input('');
  readonly whatsappUrl = input.required<string>();
  readonly productName = input('');

  readonly addToCart = output<void>();
}
