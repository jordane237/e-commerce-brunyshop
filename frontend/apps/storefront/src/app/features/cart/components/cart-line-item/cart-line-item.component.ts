import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { CartIssueDto, CartItemValidationDto } from '@bruny/data-access';
import { FcfaPipe } from '@bruny/util';
import { IconComponent, QuantitySelectorComponent } from '@bruny/ui';
import type { CartLine } from '../../../../core/cart/cart.model';

@Component({
  selector: 'app-cart-line-item',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, FcfaPipe, IconComponent, QuantitySelectorComponent],
  templateUrl: './cart-line-item.component.html',
  styleUrl: './cart-line-item.component.scss',
})
export class CartLineItemComponent {
  readonly line = input.required<CartLine>();
  readonly quantity = input.required<number>();
  readonly validationLine = input<CartItemValidationDto | null>(null);
  readonly issue = input<CartIssueDto | null>(null);

  readonly quantityChange = output<number>();
  readonly removed = output<string>();

  readonly maxQuantity = computed(() => this.validationLine()?.availableStock ?? 100);
  readonly unitPrice = computed(
    () => this.validationLine()?.unitPrice ?? this.line().unitPriceAtAdd,
  );
  readonly lineTotal = computed(() => this.unitPrice() * this.quantity());
  readonly lineIssue = computed(() => this.issue()?.message ?? null);
}
