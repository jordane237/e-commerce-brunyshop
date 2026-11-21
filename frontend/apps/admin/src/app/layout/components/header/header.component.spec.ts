import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService, SessionService } from '@bruny/core';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { RouteMetaService } from '../../navigation/route-meta.service';
import { AdminHeaderComponent } from './header.component';

function session() {
  const user = {
    id: '1',
    firstName: 'Awa',
    lastName: 'Ndiaye',
    email: 'awa@bruny.cm',
    phone: null,
    status: 'ACTIVE',
    roles: ['ADMIN'],
  };
  return {
    user: signal(user),
    userRoles: signal(['ADMIN']),
    isAuthenticated: () => true,
    hasAnyRole: () => true,
    hasRole: () => true,
  };
}

async function create() {
  const logout = vi.fn(() => of({ ok: true as const }));
  const fixture = TestBed.configureTestingModule({
    imports: [AdminHeaderComponent],
    providers: [
      provideRouter([]),
      { provide: SessionService, useValue: session() },
      { provide: AuthService, useValue: { logout } },
      {
        provide: RouteMetaService,
        useValue: { title: signal('Produits'), breadcrumbs: signal([]) },
      },
    ],
  }).createComponent(AdminHeaderComponent);
  fixture.detectChanges();
  await fixture.whenStable();
  return { fixture, logout, router: TestBed.inject(Router) };
}

describe('AdminHeaderComponent', () => {
  it('shows the user identity and opens the user menu', async () => {
    const { fixture } = await create();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('Awa Ndiaye');
    expect(element.textContent).toContain('Administrateur');

    (element.querySelector('.user-menu__trigger') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(element.querySelector('[role="menu"]')).not.toBeNull();
    expect(element.textContent).toContain('Mon profil');
    expect(element.textContent).toContain('Déconnexion');
  });

  it('delegates logout and redirects to the login page', async () => {
    const { fixture, logout, router } = await create();
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    const element = fixture.nativeElement as HTMLElement;

    (element.querySelector('.user-menu__trigger') as HTMLButtonElement).click();
    fixture.detectChanges();
    (
      Array.from(element.querySelectorAll<HTMLButtonElement>('.user-menu__item')).find((item) =>
        item.textContent?.includes('Déconnexion'),
      ) as HTMLButtonElement
    ).click();

    expect(logout).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith('/connexion');
  });

  it('closes the user menu with Échap and emits the mobile menu opening', async () => {
    const { fixture } = await create();
    let opened = false;
    fixture.componentInstance.openMenu.subscribe(() => (opened = true));
    (fixture.nativeElement.querySelector('.user-menu__trigger') as HTMLButtonElement).click();
    fixture.detectChanges();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.admin-header__menu') as HTMLButtonElement).click();

    expect(fixture.nativeElement.querySelector('[role="menu"]')).toBeNull();
    expect(opened).toBe(true);
  });
});
