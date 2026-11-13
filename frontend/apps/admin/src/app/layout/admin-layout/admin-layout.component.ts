import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, PLATFORM_ID, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AdminBottomNavComponent } from '../components/bottom-nav/bottom-nav.component';
import { AdminHeaderComponent } from '../components/header/header.component';
import { AdminMobileMenuComponent } from '../components/mobile-menu/mobile-menu.component';
import { PageTitleComponent } from '../components/page-title/page-title.component';
import { AdminSidebarComponent } from '../components/sidebar/sidebar.component';
import { RouteMetaService } from '../navigation/route-meta.service';

const COLLAPSED_KEY = 'admin-sidebar-collapsed';

@Component({
  selector: 'bruny-admin-layout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterOutlet,
    AdminSidebarComponent,
    AdminHeaderComponent,
    AdminBottomNavComponent,
    AdminMobileMenuComponent,
    PageTitleComponent,
  ],
  providers: [RouteMetaService],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss',
})
export class AdminLayoutComponent {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly browser = isPlatformBrowser(this.platformId);

  readonly sidebarCollapsed = signal(this.readCollapsed());
  readonly mobileMenuOpen = signal(false);

  toggleSidebar(): void {
    this.sidebarCollapsed.update((collapsed) => !collapsed);
    if (this.browser) {
      localStorage.setItem(COLLAPSED_KEY, String(this.sidebarCollapsed()));
    }
  }

  openMobileMenu(): void {
    this.mobileMenuOpen.set(true);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  private readCollapsed(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;
    return localStorage.getItem(COLLAPSED_KEY) === 'true';
  }
}
