import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SessionService } from '@bruny/core';
import { IconComponent } from '@bruny/ui';
import { ADMIN_NAV_ITEMS, ADMIN_PROFILE_ITEM } from '../../navigation/nav-items.config';

@Component({
  selector: 'bruny-admin-bottom-nav',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, IconComponent],
  templateUrl: './bottom-nav.component.html',
  styleUrl: './bottom-nav.component.scss',
})
export class AdminBottomNavComponent {
  private readonly session = inject(SessionService);

  readonly items = computed(() => {
    const primary = ADMIN_NAV_ITEMS.filter((item) => this.session.hasAnyRole([...item.roles]))
      .filter((item) => item.mobilePriority !== undefined)
      .sort((left, right) => (left.mobilePriority ?? 0) - (right.mobilePriority ?? 0))
      .slice(0, 4);

    const items = this.session.hasAnyRole([...ADMIN_PROFILE_ITEM.roles])
      ? [...primary, ADMIN_PROFILE_ITEM]
      : primary;

    return items;
  });
}
