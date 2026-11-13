import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SessionService } from '@bruny/core';
import { IconComponent } from '@bruny/ui';
import { ADMIN_NAV_ITEMS } from '../../navigation/nav-items.config';

@Component({
  selector: 'bruny-admin-sidebar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, IconComponent],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class AdminSidebarComponent {
  readonly collapsed = input(false);
  readonly showToggle = input(true);
  readonly drawer = input(false);

  readonly toggleCollapse = output<void>();
  readonly itemSelected = output<void>();

  private readonly session = inject(SessionService);

  readonly visibleNavItems = computed(() =>
    ADMIN_NAV_ITEMS.filter((item) => this.session.hasAnyRole([...item.roles])),
  );

  /** Le logo mène au premier module autorisé (pas de dashboard pour LIVREUR). */
  readonly homeRoute = computed(() => this.visibleNavItems()[0]?.route ?? '/profil');
}
