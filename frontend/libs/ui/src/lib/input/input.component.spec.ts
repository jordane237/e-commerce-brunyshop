import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { InputComponent } from './input.component';

@Component({
  standalone: true,
  imports: [InputComponent, ReactiveFormsModule],
  template: `
    <form [formGroup]="form">
      <bruny-input
        id="email"
        name="email"
        label="Adresse e-mail"
        type="email"
        autocomplete="email"
        placeholder="vous@exemple.com"
        hint="Format attendu : vous@exemple.com"
        [error]="error"
        formControlName="email"
      />
      <bruny-input
        id="password"
        name="password"
        label="Mot de passe"
        type="password"
        formControlName="password"
      />
    </form>
  `,
})
class InputHostComponent {
  readonly form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', { nonNullable: true }),
  });
  error = '';
}

describe('InputComponent', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  async function create(error = '') {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [InputHostComponent] });
    const fixture = TestBed.createComponent(InputHostComponent);
    fixture.componentInstance.error = error;
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture;
  }

  it('links the label to the input and renders the hint', async () => {
    const { nativeElement } = await create();
    const label = nativeElement.querySelector('label[for="email"]') as HTMLLabelElement;
    const input = nativeElement.querySelector('input#email') as HTMLInputElement;
    const hint = nativeElement.querySelector('#email-hint') as HTMLElement;

    expect(label.textContent).toContain('Adresse e-mail');
    expect(input.getAttribute('autocomplete')).toBe('email');
    expect(hint.textContent).toContain('vous@exemple.com');
  });

  it('writes the form value and emits input changes through the CVA', async () => {
    const fixture = await create();
    const host = fixture.componentInstance;
    const input = fixture.nativeElement.querySelector('input#email') as HTMLInputElement;

    host.form.controls.email.setValue('client@bruny.cm');
    fixture.detectChanges();
    expect(input.value).toBe('client@bruny.cm');

    input.value = 'autre@bruny.cm';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(host.form.controls.email.value).toBe('autre@bruny.cm');
  });

  it('shows the error, marks aria-invalid and links aria-describedby', async () => {
    const { nativeElement } = await create('Adresse e-mail invalide.');
    const input = nativeElement.querySelector('input#email') as HTMLInputElement;
    const error = nativeElement.querySelector('#email-error') as HTMLElement;

    expect(error.textContent).toContain('Adresse e-mail invalide.');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe('email-error');
  });

  it('toggles the password visibility and updates its accessible label', async () => {
    const fixture = await create();
    const nativeElement = fixture.nativeElement as HTMLElement;
    const input = nativeElement.querySelector('input#password') as HTMLInputElement;
    const toggle = nativeElement.querySelector('.bs-field__action') as HTMLButtonElement;

    expect(input.type).toBe('password');
    expect(toggle.getAttribute('aria-label')).toBe('Afficher le mot de passe');

    toggle.click();
    fixture.detectChanges();

    expect(input.type).toBe('text');
    expect(toggle.getAttribute('aria-label')).toBe('Masquer le mot de passe');
    expect(toggle.getAttribute('aria-pressed')).toBe('true');
  });

  it('disables the native input when the form control is disabled', async () => {
    const fixture = await create();
    fixture.componentInstance.form.controls.email.disable();
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input#email') as HTMLInputElement;

    expect(input.disabled).toBe(true);
  });
});
