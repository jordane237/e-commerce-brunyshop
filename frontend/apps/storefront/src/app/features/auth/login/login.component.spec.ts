import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { AuthService, SessionService, ToastService } from '@bruny/core';
import { PublicConfigService } from '@bruny/data-access';
import { LoginComponent } from './login.component';

function create(
  queryParams: Record<string, string> = {},
  loginResult: unknown = {
    accessToken: 'token',
    user: {
      id: 'user-1',
      email: 'client@bruny.cm',
      phone: null,
      firstName: 'Awa',
      lastName: 'Nkeng',
      status: 'ACTIVE',
      roles: ['CUSTOMER'],
    },
  },
) {
  TestBed.resetTestingModule();
  const auth = { login: vi.fn(() => of(loginResult)) };
  const toast = { success: vi.fn(), error: vi.fn() };
  const router = { navigateByUrl: vi.fn().mockResolvedValue(true) };
  const route = { snapshot: { queryParamMap: convertToParamMap(queryParams) } };
  const config = {
    getConfig: vi.fn(() => of({ turnstileEnabled: false, turnstileSiteKey: null })),
  };

  TestBed.configureTestingModule({
    imports: [LoginComponent],
    providers: [
      provideRouter([]),
      { provide: AuthService, useValue: auth },
      { provide: ToastService, useValue: toast },
      { provide: Router, useValue: router },
      { provide: ActivatedRoute, useValue: route },
      { provide: PublicConfigService, useValue: config },
    ],
  });
  const fixture = TestBed.createComponent(LoginComponent);
  fixture.detectChanges();
  return { fixture, auth, toast, router, session: TestBed.inject(SessionService) };
}

function setInput(fixture: ReturnType<typeof create>['fixture'], id: string, value: string): void {
  const input = fixture.nativeElement.querySelector(`input#${id}`) as HTMLInputElement;
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  fixture.detectChanges();
}

describe('LoginComponent', () => {
  it('renders the P14 title, fields and links', () => {
    const { fixture } = create();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('h1')?.textContent).toContain('Se connecter');
    expect(element.textContent).toContain('ESPACE CLIENT');
    expect(element.textContent).toContain('Mot de passe oublié ?');
    expect(element.textContent).toContain('Pas encore de compte ?');
    expect(element.querySelector('input#login-identifier')).not.toBeNull();
    expect(element.querySelector('input#login-password')).not.toBeNull();
  });

  it('validates the identifier and password in French', () => {
    const { fixture } = create();
    const component = fixture.componentInstance;

    component.form.controls.identifier.markAsTouched();
    component.form.controls.password.markAsTouched();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      'Saisissez votre e-mail ou votre numéro de téléphone.',
    );
    expect(fixture.nativeElement.textContent).toContain('Saisissez votre mot de passe.');

    setInput(fixture, 'login-identifier', 'invalid');
    component.form.controls.identifier.markAsTouched();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Saisissez un e-mail valide');
  });

  it('accepts an email or a +237 phone number', () => {
    const { fixture } = create();
    const component = fixture.componentInstance;

    setInput(fixture, 'login-identifier', 'client@exemple.cm');
    expect(component.identifierError()).toBeNull();

    setInput(fixture, 'login-identifier', '+237612345678');
    expect(component.identifierError()).toBeNull();
  });

  it('does not call the API when the form is invalid', () => {
    const { fixture, auth } = create();

    fixture.componentInstance.onSubmit();
    fixture.detectChanges();

    expect(auth.login).not.toHaveBeenCalled();
    expect(fixture.componentInstance.submitted()).toBe(true);
  });

  it('sends identifier and password and navigates to returnUrl', async () => {
    const { fixture, auth, router } = create({ returnUrl: '/catalogue' });
    const component = fixture.componentInstance;

    setInput(fixture, 'login-identifier', 'CLIENT@EXEMPLE.CM');
    setInput(fixture, 'login-password', 'Brune!2026');
    component.onSubmit();
    await fixture.whenStable();

    expect(auth.login).toHaveBeenCalledWith({
      identifier: 'client@exemple.cm',
      password: 'Brune!2026',
    });
    expect(router.navigateByUrl).toHaveBeenCalledWith('/catalogue');
  });

  it('supports the redirect alias and defaults to /compte', async () => {
    const redirected = create({ redirect: '/panier' });
    setInput(redirected.fixture, 'login-identifier', 'client@exemple.cm');
    setInput(redirected.fixture, 'login-password', 'Brune!2026');
    redirected.fixture.componentInstance.onSubmit();
    await redirected.fixture.whenStable();
    expect(redirected.router.navigateByUrl).toHaveBeenCalledWith('/panier');

    const fallback = create();
    setInput(fallback.fixture, 'login-identifier', 'client@exemple.cm');
    setInput(fallback.fixture, 'login-password', 'Brune!2026');
    fallback.fixture.componentInstance.onSubmit();
    await fallback.fixture.whenStable();
    expect(fallback.router.navigateByUrl).toHaveBeenCalledWith('/compte');
  });

  it('shows the generic invalid-credentials message on 401', async () => {
    const { fixture, auth } = create({}, undefined);
    auth.login.mockReturnValue(
      throwError(
        () => new HttpErrorResponse({ status: 401, error: { code: 'INVALID_CREDENTIALS' } }),
      ),
    );

    setInput(fixture, 'login-identifier', 'client@exemple.cm');
    setInput(fixture, 'login-password', 'wrong-password');
    fixture.componentInstance.onSubmit();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'E-mail/téléphone ou mot de passe incorrect.',
    );
  });

  it('shows the lockout message for TOO_MANY_ATTEMPTS', async () => {
    const { fixture, auth } = create({}, undefined);
    auth.login.mockReturnValue(
      throwError(
        () => new HttpErrorResponse({ status: 401, error: { code: 'TOO_MANY_ATTEMPTS' } }),
      ),
    );

    setInput(fixture, 'login-identifier', 'client@exemple.cm');
    setInput(fixture, 'login-password', 'Brune!2026');
    fixture.componentInstance.onSubmit();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'Trop de tentatives. Patientez une minute avant de réessayer.',
    );
  });

  it('toggles password visibility', () => {
    const { fixture } = create();
    const input = fixture.nativeElement.querySelector('input#login-password') as HTMLInputElement;
    const toggle = fixture.nativeElement.querySelector('.bs-field__action') as HTMLButtonElement;

    expect(input.type).toBe('password');
    toggle.click();
    fixture.detectChanges();
    expect(input.type).toBe('text');
    expect(toggle.getAttribute('aria-label')).toBe('Masquer le mot de passe');
  });

  it('announces the backend error with role=alert', () => {
    const { fixture } = create({}, undefined);
    fixture.componentInstance.backendError.set('Connexion impossible.');
    fixture.detectChanges();

    const alert = fixture.nativeElement.querySelector('[role="alert"]') as HTMLElement;
    expect(alert.textContent).toContain('Connexion impossible.');
  });
});
