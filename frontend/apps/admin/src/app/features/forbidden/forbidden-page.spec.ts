import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from '@bruny/core';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { ForbiddenPage } from './forbidden-page';

describe('ForbiddenPage', () => {
  it('renders the 403 message and both actions', async () => {
    const fixture = TestBed.configureTestingModule({
      imports: [ForbiddenPage],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { logout: vi.fn(() => of({ ok: true })) } },
      ],
    }).createComponent(ForbiddenPage);
    fixture.detectChanges();
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('h1')?.textContent).toContain('Accès refusé');
    expect(element.textContent).toContain("Vous n'avez pas accès à cette page.");
    expect(element.querySelector('a[href="/"]')?.textContent).toContain(
      'Retour au tableau de bord',
    );
  });

  it('logs out and redirects to the login page', async () => {
    const logout = vi.fn(() => of({ ok: true }));
    const fixture = TestBed.configureTestingModule({
      imports: [ForbiddenPage],
      providers: [provideRouter([]), { provide: AuthService, useValue: { logout } }],
    }).createComponent(ForbiddenPage);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    fixture.detectChanges();
    await fixture.whenStable();

    (fixture.nativeElement.querySelector('.forbidden__link') as HTMLButtonElement).click();

    expect(logout).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith('/connexion');
  });
});
