import { Component, signal } from '@angular/core';
import { FormControl } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { CgvCheckboxComponent } from './cgv-checkbox.component';

@Component({
  standalone: true,
  imports: [CgvCheckboxComponent],
  template: `<bruny-cgv-checkbox inputId="conditions" [control]="control" [error]="error()" />`,
})
class CgvHostComponent {
  readonly control = new FormControl(false, { nonNullable: true });
  readonly error = signal<string | null>(null);
}

describe('CgvCheckboxComponent', () => {
  async function create(error: string | null = null) {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [CgvHostComponent],
      providers: [provideRouter([])],
    });
    const fixture = TestBed.createComponent(CgvHostComponent);
    fixture.componentInstance.error.set(error);
    fixture.detectChanges();
    return fixture;
  }

  it('lie la case au FormControl', async () => {
    const fixture = await create();
    const input = fixture.nativeElement.querySelector('input[type="checkbox"]') as HTMLInputElement;

    expect(input.checked).toBe(false);
    input.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.control.value).toBe(true);
  });

  it('affiche les liens légaux dans un nouvel onglet', async () => {
    const fixture = await create();
    const links = fixture.nativeElement.querySelectorAll('a');

    expect(links.length).toBe(2);
    expect(links[0].getAttribute('href')).toBe('/cgv');
    expect(links[1].getAttribute('href')).toBe('/politique-confidentialite');
    expect(links[0].getAttribute('target')).toBe('_blank');
    expect(links[0].getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('affiche l’erreur et les attributs ARIA', async () => {
    const fixture = await create('Acceptez les conditions générales pour créer votre compte.');
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const error = fixture.nativeElement.querySelector('[role="alert"]') as HTMLElement;

    expect(error.textContent).toContain('Acceptez les conditions générales');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe('conditions-error');
  });
});
