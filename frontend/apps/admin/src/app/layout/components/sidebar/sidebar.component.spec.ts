import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SessionService } from '@bruny/core';
import { describe, expect, it } from 'vitest';
import { AdminSidebarComponent } from './sidebar.component';

function session(roles: string[]) {
  return {
    user: signal({ id: '1', firstName: 'Awa', lastName: 'N.', roles }),
    userRoles: signal(roles),
    isAuthenticated: () => true,
    hasRole: (role: string) => roles.includes(role),
    hasAnyRole: (allowed: string[]) => allowed.some((role) => roles.includes(role)),
  };
}

async function create(roles: string[], collapsed = false) {
  const fixture = TestBed.configureTestingModule({
    imports: [AdminSidebarComponent],
    providers: [provideRouter([]), { provide: SessionService, useValue: session(roles) }],
  }).createComponent(AdminSidebarComponent);
  fixture.componentRef.setInput('collapsed', collapsed);
  fixture.detectChanges();
  await fixture.whenStable();
  return fixture;
}

describe('AdminSidebarComponent', () => {
  it('shows every module to a SUPER_ADMIN', async () => {
    const fixture = await create(['SUPER_ADMIN']);
    const labels = Array.from(
      fixture.nativeElement.querySelectorAll<HTMLElement>('.sidebar__label'),
    ).map((label) => label.textContent?.trim());

    expect(labels).toContain('Tableau de bord');
    expect(labels).toContain('Audit');
    expect(labels).toContain('Paramètres');
    expect(fixture.nativeElement.querySelectorAll('.sidebar__item')).toHaveLength(11);
  });

  it('limits a STOCK_MANAGER to dashboard, products and stock', async () => {
    const fixture = await create(['STOCK_MANAGER']);
    const labels = Array.from(
      fixture.nativeElement.querySelectorAll<HTMLElement>('.sidebar__label'),
    ).map((label) => label.textContent?.trim());

    expect(labels).toEqual(['Tableau de bord', 'Produits', 'Stock', 'Replier']);
    expect(fixture.nativeElement.querySelector('a[href="/audit"]')).toBeNull();
  });

  it('shows only deliveries to a LIVREUR', async () => {
    const fixture = await create(['LIVREUR']);
    const labels = Array.from(
      fixture.nativeElement.querySelectorAll<HTMLElement>('.sidebar__label'),
    ).map((label) => label.textContent?.trim());

    expect(labels).toEqual(['Mes livraisons', 'Replier']);
  });

  it('applies the collapsed class and emits the toggle', async () => {
    const fixture = await create(['ADMIN'], true);
    let toggled = false;
    fixture.componentInstance.toggleCollapse.subscribe(() => (toggled = true));

    expect(fixture.nativeElement.querySelector('.sidebar--collapsed')).not.toBeNull();
    fixture.nativeElement.querySelector('.sidebar__toggle').click();

    expect(toggled).toBe(true);
  });
});
