import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService, SessionService } from '@bruny/core';
import { IconComponent } from '@bruny/ui';
import {
  ADMIN_NAV_ITEMS,
  ADMIN_PROFILE_ITEM,
  ROLE_LABELS,
} from '../../navigation/nav-items.config';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { NotificationBellComponent } from '../notification-bell/notification-bell.component';

@Component({
  selector: 'bruny-admin-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterLink,
    IconComponent,
    BreadcrumbComponent,
    NotificationBellComponent,
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class AdminHeaderComponent {
  private readonly session = inject(SessionService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  readonly menuOpen = input(false);
  readonly openMenu = output<void>();

  readonly userMenuOpen = signal(false);
  readonly loggingOut = signal(false);

  readonly displayName = computed(() => {
    const user = this.session.user();
    if (!user) return 'Utilisateur';
    const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
    return name || user.email || 'Utilisateur';
  });

  readonly initials = computed(() =>
    this.displayName()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toLocaleUpperCase('fr-FR'))
      .join(''),
  );

  readonly roleLabel = computed(() => {
    const role = this.session.userRoles()[0];
    return role ? (ROLE_LABELS[role] ?? role) : 'Équipe';
  });

  readonly homeRoute = computed(
    () =>
      ADMIN_NAV_ITEMS.find((item) => this.session.hasAnyRole([...item.roles]))?.route ??
      ADMIN_PROFILE_ITEM.route,
  );

  toggleUserMenu(): void {
    this.userMenuOpen.update((open) => !open);
  }

  closeUserMenu(): void {
    this.userMenuOpen.set(false);
  }

  logout(): void {
    if (this.loggingOut()) return;
    this.loggingOut.set(true);
    this.auth.logout().subscribe({
      next: () => void this.router.navigateByUrl('/connexion'),
      error: () => void this.router.navigateByUrl('/connexion'),
    });
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.userMenuOpen()) {
      this.closeUserMenu();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.userMenuOpen()) return;
    const target = event.target;
    if (target instanceof Node && !this.elementRef.nativeElement.contains(target)) {
      this.closeUserMenu();
    }
  }
}
