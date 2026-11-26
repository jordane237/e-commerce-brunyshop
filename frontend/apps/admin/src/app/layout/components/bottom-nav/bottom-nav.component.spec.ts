import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SessionService } from '@bruny/core';
import { describe, expect, it } from 'vitest';
import { AdminBottomNavComponent } from './bottom-nav.component';

function session(roles: string[]) {
  return {
    user: signal({ id: '1', roles }),
    userRoles: signal(roles),
    hasAnyRole: (allowed: string[]) => allowed.some((role) => roles.includes(role)),
  };
}

async function create(roles: string[]) {
  const fixture = TestBed.configureTestingModule({
    imports: [AdminBottomNavComponent],
    providers: [provideRouter([]), { provide: SessionService, useValue: session(roles) }],
  }).createComponent(AdminBottomNavComponent);
  fixture.detectChanges();
  await fixture.whenStable();
  return fixture;
}

describe('AdminBottomNavComponent', () => {
  it('shows four primary entries plus profile for an ADMIN', async () => {
    const fixture = await create(['ADMIN']);
    const labels = Array.from(
      fixture.nativeElement.querySelectorAll<HTMLElement>('.bottom-nav__item span'),
    ).map((label) => label.textContent?.trim());

    expect(labels).toEqual(['Tableau de bord', 'Produits', 'Commandes', 'Stock', 'Mon profil']);
  });

  it('adapts to ORDER_MANAGER', async () => {
    const order = await create(['ORDER_MANAGER']);
    expect(order.nativeElement.textContent).toContain('Clients');
    expect(order.nativeElement.textContent).not.toContain('Produits');
  });

  it('limits the LIVREUR bar to deliveries and profile', async () => {
    const driver = await create(['LIVREUR']);
    expect(driver.nativeElement.querySelectorAll('.bottom-nav__item')).toHaveLength(2);
    expect(driver.nativeElement.textContent).toContain('Mes livraisons');
  });
});
