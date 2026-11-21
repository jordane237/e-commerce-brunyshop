import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { AuthService, ToastService } from '@bruny/core';
import { PublicConfigService } from '@bruny/data-access';
import { RegisterComponent } from './register.component';

function create(
  queryParams: Record<string, string> = {},
  registerResult: unknown = { id: 'user-2' },
) {
  TestBed.resetTestingModule();
  const auth = { register: vi.fn(() => of(registerResult)) };
  const toast = { success: vi.fn(), error: vi.fn() };
  const route = { snapshot: { queryParamMap: convertToParamMap(queryParams) } };
  const config = {
    getConfig: vi.fn(() => of({ turnstileEnabled: false, turnstileSiteKey: null })),
  };

  TestBed.configureTestingModule({
    imports: [RegisterComponent],
    providers: [
      provideRouter([]),
      { provide: AuthService, useValue: auth },
      { provide: ToastService, useValue: toast },
      { provide: ActivatedRoute, useValue: route },
      { provide: PublicConfigService, useValue: config },
    ],
  });
  const fixture = TestBed.createComponent(RegisterComponent);
  fixture.detectChanges();
  return { fixture, auth, toast };
}

function fillValidEmailForm(fixture: ReturnType<typeof create>['fixture']): void {
  const component = fixture.componentInstance;
  component.form.controls.firstName.setValue('Jean-Paul');
  component.form.controls.lastName.setValue('Mbarga');
  component.form.controls.email.setValue('client@exemple.cm');
  component.form.controls.password.setValue('Brune!2026');
  component.form.controls.confirmPassword.setValue('Brune!2026');
  component.form.controls.cgv.setValue(true);
  fixture.detectChanges();
}

describe('RegisterComponent', () => {
  it('renders the P15 title, tabs and fields', () => {
    const { fixture } = create();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('h1')?.textContent).toContain('Créer un compte');
    expect(element.textContent).toContain('E-mail');
    expect(element.textContent).toContain('Téléphone');
    expect(element.textContent).toContain('Prénom');
    expect(element.textContent).toContain('Nom');
    expect(element.textContent).toContain('conditions générales de vente');
  });

  it('switches between email and phone while clearing the other identifier', () => {
    const { fixture } = create();
    const component = fixture.componentInstance;

    component.form.controls.email.setValue('client@exemple.cm');
    component.selectChannel('phone');
    fixture.detectChanges();
    expect(component.form.controls.channel.value).toBe('phone');
    expect(component.form.controls.email.value).toBe('');
    expect(fixture.nativeElement.querySelector('input#register-phone')).not.toBeNull();

    component.selectChannel('email');
    fixture.detectChanges();
    expect(component.form.controls.phone.value).toBe('');
    expect(fixture.nativeElement.querySelector('input#register-email')).not.toBeNull();
  });

  it('validates required names, CGV and fields', () => {
    const { fixture } = create();
    const component = fixture.componentInstance;

    component.onSubmit();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Indiquez votre prénom.');
    expect(fixture.nativeElement.textContent).toContain('Indiquez votre nom.');
    expect(fixture.nativeElement.textContent).toContain(
      'Acceptez les conditions générales pour créer votre compte.',
    );
  });

  it('validates email and phone formats', () => {
    const { fixture } = create();
    const component = fixture.componentInstance;

    component.form.controls.email.setValue('invalid');
    component.form.controls.email.markAsTouched();
    expect(component.emailError()).toContain('Saisissez un e-mail valide');

    component.selectChannel('phone');
    component.form.controls.phone.setValue('123');
    component.form.controls.phone.markAsTouched();
    expect(component.phoneError()).toContain('numéro camerounais à 9 chiffres');
  });

  it('validates password length, blacklist, variety and confirmation', () => {
    const { fixture } = create();
    const component = fixture.componentInstance;

    component.form.controls.password.setValue('short');
    component.form.controls.password.markAsTouched();
    expect(component.passwordError()).toContain('au moins 10 caractères');

    component.form.controls.password.setValue('password123');
    component.form.controls.password.markAsTouched();
    expect(component.passwordError()).toContain('trop courant');

    component.form.controls.password.setValue('aaaaaaaaaa');
    component.form.controls.password.markAsTouched();
    expect(component.passwordError()).toContain('Mélangez au moins deux catégories');

    component.form.controls.password.setValue('Brune!2026');
    component.form.controls.confirmPassword.setValue('Autre!2026');
    component.form.controls.confirmPassword.markAsTouched();
    expect(component.confirmPasswordError()).toContain('ne correspondent pas');
  });

  it('updates the password strength indicator live', () => {
    const { fixture } = create();
    const component = fixture.componentInstance;

    component.form.controls.password.setValue('short');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Force : Faible');

    component.form.controls.password.setValue('Brune!2026Shop');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Force : Excellent');
  });

  it('does not call the API when the form is invalid', () => {
    const { fixture, auth } = create();
    fixture.componentInstance.onSubmit();
    fixture.detectChanges();

    expect(auth.register).not.toHaveBeenCalled();
  });

  it('submits the email payload with CGV version and shows the neutral success panel', () => {
    const { fixture, auth, toast } = create({ returnUrl: '/catalogue' });
    fillValidEmailForm(fixture);

    fixture.componentInstance.onSubmit();
    fixture.detectChanges();

    expect(auth.register).toHaveBeenCalledWith({
      email: 'client@exemple.cm',
      password: 'Brune!2026',
      firstName: 'Jean-Paul',
      lastName: 'Mbarga',
      termsAccepted: true,
      termsVersion: '1.0',
    });
    expect(fixture.nativeElement.textContent).toContain('Votre compte est créé');
    expect(fixture.nativeElement.textContent).not.toContain('Vérifiez votre adresse e-mail');
    expect(fixture.nativeElement.querySelector('a[href*="identifier"]')).not.toBeNull();
    expect(toast.success).toHaveBeenCalledWith('Votre compte est créé.');
  });

  it('normalizes a local phone before sending it', () => {
    const { fixture, auth } = create();
    const component = fixture.componentInstance;
    component.selectChannel('phone');
    component.form.controls.firstName.setValue('Awa');
    component.form.controls.lastName.setValue('Nkeng');
    component.form.controls.phone.setValue('612345678');
    component.form.controls.password.setValue('Brune!2026');
    component.form.controls.confirmPassword.setValue('Brune!2026');
    component.form.controls.cgv.setValue(true);

    component.onSubmit();

    expect(auth.register).toHaveBeenCalledWith(expect.objectContaining({ phone: '+237612345678' }));
  });

  it('shows the lockout message on TOO_MANY_ATTEMPTS', () => {
    const { fixture, auth } = create({}, undefined);
    auth.register.mockReturnValue(
      throwError(
        () => new HttpErrorResponse({ status: 429, error: { code: 'TOO_MANY_ATTEMPTS' } }),
      ),
    );
    fillValidEmailForm(fixture);

    fixture.componentInstance.onSubmit();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'Trop de tentatives. Patientez une minute avant de réessayer.',
    );
  });

  it('exposes accessible names and the tablist semantics', () => {
    const { fixture } = create();
    const element = fixture.nativeElement as HTMLElement;
    const tabs = element.querySelectorAll('[role="tab"]');

    expect(tabs.length).toBe(2);
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
    expect(element.querySelector('[role="tablist"]')).not.toBeNull();
    expect(element.querySelector('input#register-first-name')?.getAttribute('autocomplete')).toBe(
      'given-name',
    );
  });
});
