import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { ButtonComponent } from './button.component';

@Component({
  standalone: true,
  imports: [ButtonComponent],
  template: `
    <bruny-button
      [disabled]="disabled()"
      [loading]="loading()"
      [iconOnly]="iconOnly()"
      ariaLabel="Action de test"
    >
      Ajouter
    </bruny-button>
  `,
})
class ButtonHostComponent {
  readonly disabled = signal(false);
  readonly loading = signal(false);
  readonly iconOnly = signal(false);
}

describe('ButtonComponent', () => {
  async function create() {
    await TestBed.configureTestingModule({ imports: [ButtonHostComponent] }).compileComponents();
    const fixture = TestBed.createComponent(ButtonHostComponent);
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    return { fixture, button };
  }

  it('renders the projected label', async () => {
    const { button } = await create();
    expect(button.textContent).toContain('Ajouter');
  });

  it('keeps a native button that can receive the focus', async () => {
    const { button } = await create();
    button.focus();
    expect(document.activeElement).toBe(button);
  });

  it('disables the native button when disabled', async () => {
    const { fixture, button } = await create();
    fixture.componentInstance.disabled.set(true);
    await fixture.whenStable();
    expect(button.disabled).toBe(true);
  });

  it('shows a spinner and aria-busy while loading', async () => {
    const { fixture, button } = await create();
    fixture.componentInstance.loading.set(true);
    await fixture.whenStable();
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.disabled).toBe(true);
    expect(fixture.nativeElement.querySelector('bruny-spinner')).not.toBeNull();
  });

  it('exposes an accessible name on icon-only buttons', async () => {
    const { fixture, button } = await create();
    fixture.componentInstance.iconOnly.set(true);
    await fixture.whenStable();
    expect(button.getAttribute('aria-label')).toBe('Action de test');
    expect(button.classList.contains('bs-button--icon-only')).toBe(true);
  });
});
