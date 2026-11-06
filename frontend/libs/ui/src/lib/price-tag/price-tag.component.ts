import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FcfaPipe } from '@bruny/util';

@Component({
  selector: 'bruny-price-tag',
  standalone: true,
  imports: [FcfaPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './price-tag.component.html',
  styleUrl: './price-tag.component.scss',
})
export class PriceTagComponent {
  @Input({ required: true }) amount = 0;
  @Input() compareAt: number | null = null;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
}
