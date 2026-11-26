import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { IconComponent, IconName } from '../icon/icon.component';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const PRODUCT_STATUS: Record<string, { label: string; variant: BadgeVariant; icon: IconName }> = {
  PUBLISHED: { label: 'Publié', variant: 'success', icon: 'check-circle' },
  DRAFT: { label: 'Brouillon', variant: 'warning', icon: 'edit' },
  ARCHIVED: { label: 'Archivé', variant: 'danger', icon: 'archive' },
};

@Component({
  selector: 'bruny-status-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  templateUrl: './status-badge.component.html',
  styleUrl: './status-badge.component.scss',
})
export class StatusBadgeComponent {
  readonly domain = input<string>('product');
  readonly status = input<string>('');
  readonly label = input<string>('');
  readonly variant = input<BadgeVariant | null>(null);

  readonly resolved = computed(() => {
    if (this.domain() === 'product' && PRODUCT_STATUS[this.status()]) {
      return PRODUCT_STATUS[this.status()];
    }
    return {
      label: this.label() || this.status(),
      variant: this.variant() ?? 'neutral',
      icon: 'info' as IconName,
    };
  });

  get variantClass(): string {
    return `bruny-status-badge--${this.resolved().variant}`;
  }
}
