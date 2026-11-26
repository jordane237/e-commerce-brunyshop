import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { PasswordStrengthIndicatorComponent } from './password-strength-indicator.component';

@Component({
  standalone: true,
  imports: [PasswordStrengthIndicatorComponent],
  template: `<bruny-password-strength-indicator [password]="password()" />`,
})
class PasswordStrengthHostComponent {
  readonly password = signal('short');
}

describe('PasswordStrengthIndicatorComponent', () => {
  async function create(password: string) {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [PasswordStrengthHostComponent] });
    const fixture = TestBed.createComponent(PasswordStrengthHostComponent);
    fixture.componentInstance.password.set(password);
    fixture.detectChanges();
    return fixture;
  }

  it('annonce Faible pour un mot de passe trop court', async () => {
    const fixture = await create('short');
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('Force : Faible');
    expect(element.querySelector('[data-strength="weak"]')).not.toBeNull();
  });

  it('annonce Moyen pour 10 caractères sans diversité', async () => {
    const fixture = await create('abcdefghij');
    expect(fixture.nativeElement.textContent).toContain('Force : Moyen');
  });

  it('annonce Bon pour un mot de passe varié', async () => {
    const fixture = await create('Valid12345');
    expect(fixture.nativeElement.textContent).toContain('Force : Bon');
  });

  it('annonce Excellent pour un mot de passe long et varié', async () => {
    const fixture = await create('Valid12345!A');
    expect(fixture.nativeElement.textContent).toContain('Force : Excellent');
  });

  it('affiche les critères et une zone live', async () => {
    const fixture = await create('Valid12345');
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('[aria-live="polite"]')).not.toBeNull();
    expect(element.querySelector('ul[role="list"]')).not.toBeNull();
    expect(element.textContent).toContain('Au moins 10 caractères');
    expect(element.textContent).toContain('Pas un mot de passe courant');
  });

  it('ne rend rien sans mot de passe', async () => {
    const fixture = await create('');
    expect(fixture.nativeElement.querySelector('.pwd-strength')).toBeNull();
  });
});
