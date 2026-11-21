import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IconComponent, type IconName } from '@bruny/ui';

export interface ReassurancePoint {
  readonly icon: IconName;
  readonly label: string;
  readonly description?: string;
}

@Component({
  selector: 'app-cart-reassurance',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  templateUrl: './cart-reassurance.component.html',
  styleUrl: './cart-reassurance.component.scss',
})
export class CartReassuranceComponent {
  readonly points = input<ReassurancePoint[]>([]);
}
