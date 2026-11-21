import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

export type BadgeVariant =
  | 'promo'
  | 'new'
  | 'accent'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral'
  | 'outline';

@Component({
  selector: 'bruny-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './badge.component.html',
  styleUrl: './badge.component.scss',
})
export class BadgeComponent {
  @Input() variant: BadgeVariant = 'accent';
  @Input() size: 'sm' | 'md' = 'sm';
  @Input() dot = false;
}
