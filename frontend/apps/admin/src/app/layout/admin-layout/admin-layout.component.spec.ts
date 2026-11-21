import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService, SessionService } from '@bruny/core';
import { of } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AdminLayoutComponent } from './admin-layout.component';

function session() {
  return {
    user: signal({
      id: '1',
      firstName: 'Awa',
      lastName: 'N.',
      email: 'awa@bruny.cm',
      phone: null,
      status: 'ACTIVE',
      roles: ['ADMIN'],
    }),
    userRoles: signal(['ADMIN']),
    isAuthenticated: () => true,
    hasAnyRole: (roles: string[]) => roles.includes('ADMIN'),
    hasRole: (role: string) => role === 'ADMIN',
  };
}

async function create() {
  const fixture = TestBed.configureTestingModule({
    imports: [AdminLayoutComponent],
    providers: [
      provideRouter([]),
      { provide: SessionService, useValue: session() },
      { provide: AuthService, useValue: { logout: vi.fn(() => of({ ok: true })) } },
    ],
  }).createComponent(AdminLayoutComponent);
  fixture.detectChanges();
  await fixture.whenStable();
  return fixture;
}

afterEach(() => localStorage.clear());

describe('AdminLayoutComponent', () => {
  it('renders sidebar, header, skip link, content and bottom nav', async () => {
    const fixture = await create();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('bruny-admin-sidebar')).not.toBeNull();
    expect(element.querySelector('bruny-admin-header')).not.toBeNull();
    expect(element.querySelector('#admin-content')).not.toBeNull();
    expect(element.querySelector('bruny-admin-bottom-nav')).not.toBeNull();
    expect(element.querySelector('.skip-link')?.getAttribute('href')).toBe('#admin-content');
  });

  it('toggles the sidebar and stores the preference only', async () => {
    const fixture = await create();
    const element = fixture.nativeElement as HTMLElement;

    (element.querySelector('.sidebar__toggle') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(element.querySelector('.admin-layout--collapsed')).not.toBeNull();
    expect(localStorage.getItem('admin-sidebar-collapsed')).toBe('true');
    expect(localStorage.length).toBe(1);

    (element.querySelector('.sidebar__toggle') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(localStorage.getItem('admin-sidebar-collapsed')).toBe('false');
  });

  it('restores the collapsed preference on creation', async () => {
    localStorage.setItem('admin-sidebar-collapsed', 'true');
    const fixture = await create();

    expect(fixture.nativeElement.querySelector('.admin-layout--collapsed')).not.toBeNull();
    expect(fixture.componentInstance.sidebarCollapsed()).toBe(true);
  });

  it('opens and closes the mobile menu', async () => {
    const fixture = await create();
    fixture.componentInstance.openMobileMenu();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('#admin-mobile-menu')).not.toBeNull();

    fixture.componentInstance.closeMobileMenu();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#admin-mobile-menu')).toBeNull();
  });
});
