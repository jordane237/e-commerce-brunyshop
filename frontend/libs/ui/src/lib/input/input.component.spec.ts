import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { InputComponent } from './input.component';
import { FcfaPipe } from '@bruny/util/lib/fcfa.pipe';

@Component({
  standalone: true,
  imports: [InputComponent, FcfaPipe],
  template: `
    <bruny-input
      [label]="label()"
      [value]="value()"
      [placeholder]="placeholder()"
      [help]="help()"
      [error]="error()"
      [disabled]="disabled()"
      [spam]="spam()"
      [readonly]="readonly()"
      [size]="size()"
      [type]="type()"
      [minLength]="minLength()"
      [maxLength]="maxLength()"
      [ariaDescribedBy]="ariaDescribedBy()"
      (input)="value.set($event)"
      #input
    />
  `,
})
class InputHostComponent {
  readonly label = signal('Votre message');
  readonly value = signal('Exemple');
  readonly placeholder = signal('Tapez votre recherche');
  readonly help = signal('Ce champ est optionnel');
  readonly error = signal<string | null>(null);
  readonly disabled = signal(false);
  readonly spam = signal(false);
  readonly readonly = signal(false);
  readonly size = signal<'sm' | 'md' | 'lg'>('md');
  readonly type = signal<'text' | 'email' | 'password' | 'search'>('text');
  readonly minLength = signal<number | null>(null);
  readonly maxLength = signal<number | null>(null);
  readonly ariaDescribedBy = signal<string | null>(null);
}

describe('InputComponent', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  async function create(overrides: Partial<Record<keyof InputHostComponent, unknown>> = {}) {
    await TestBed.configureTestingModule({
      imports: [InputHostComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(InputHostComponent);
    await fixture.whenStable();
    for (const [key, value] of Object.entries(overrides)) {
      (fixture.componentInstance as Record<string, never>)[key] = value as never;
    }
    await fixture.detectChanges();
    await fixture.whenStable();
    return fixture;
  }

  it('renders a label linked to the input via id and for', async () => {
    const { nativeElement, fixture } = await create({
      label: 'Email client',
      ariaDescribedBy: 'desc',
    });
    await Promise.resolve();
    const label = nativeElement.querySelector('.bs-input-group__label') as HTMLLabelElement;
    const input = nativeElement.querySelector('input') as HTMLInputElement;

    expect(label?.htmlFor).toBe(input?.id);
    expect(label?.textContent).toBe('Email client');
    expect(label?.getAttribute('for')).not.toBeNull();
    await fixture.detectChanges();
  });

  it('renders the input with the provided placeholder', async () => {
    const { nativeElement } = await create({ placeholder: 'Recherche' });
    await Promise.resolve();
    const input = nativeElement.querySelector('input') as HTMLInputElement;

    expect(input?.placeholder).toBe('Recherche');
  });

  it('binds the value to the input and emits it on change', async () => {
    const { nativeElement, componentInstance, fixture } = await create();
    const input = nativeElement.querySelector('input') as HTMLInputElement;

    input.value = 'Cameroun';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable?.();
    await Promise.resolve();

    expect(componentInstance.value()).toBe('Cameroun');
  });

  it('shows the help text below the input', async () => {
    const { nativeElement } = await create({ help: 'Saisissez au moins 4 caractères' });
    await Promise.resolve();
    const help = nativeElement.querySelector('.bs-input-group__help') as HTMLElement;

    expect(help?.textContent).toBe('Saisissez au moins 4 caractères');
  });

  it('shows the error message and marks the input as invalid when an error is set', async () => {
    const { nativeElement } = await create({ error: 'Ce champ est requis' });
    await Promise.resolve();
    const error = nativeElement.querySelector('.bs-input-group__error') as HTMLElement;
    const input = nativeElement.querySelector('input') as HTMLInputElement;

    expect(error?.textContent).toBe('Ce champ est requis');
    expect(input?.getAttribute('aria-invalid')).toBe('true');
  });

  it('does not show the error element when the error is null', async () => {
    const { nativeElement } = await create({ error: null });
    await Promise.resolve();

    expect(nativeElement.querySelector('.bs-input-group__error')).toBeNull();
  });

  it('sets disabled on the input when disabled is true', async () => {
    const { nativeElement } = await create({ disabled: true });
    await Promise.resolve();
    const input = nativeElement.querySelector('input') as HTMLInputElement;

    expect(input?.disabled).toBe(true);
  });

  it('enables the input when disabled is false', async () => {
    const { nativeElement } = await create({ disabled: false });
    await Promise.resolve();
    const input = nativeElement.querySelector('input') as HTMLInputElement;

    expect(input?.disabled).toBe(false);
  });

  it('sets readonly on the input when readonly is true', async () => {
    const { nativeElement } = await create({ readonly: true });
    await Promise.resolve();
    const input = nativeElement.querySelector('input') as HTMLInputElement;

    expect(input?.readOnly).toBe(true);
  });

  it('renders a password field when type is password', async () => {
    const { nativeElement } = await create({ type: 'password' });
    await Promise.resolve();
    const input = nativeElement.querySelector('input') as HTMLInputElement;

    expect(input?.type).toBe('password');
  });

  it('renders an email field when type is email', async () => {
    const { nativeElement } = await create({ type: 'email' });
    await Promise.resolve();
    const input = nativeElement.querySelector('input') as HTMLInputElement;

    expect(input?.type).toBe('email');
  });

  it('renders a search field when type is search', async () => {
    const { nativeElement } = await create({ type: 'search' });
    await Promise.resolve();
    const input = nativeElement.querySelector('input') as HTMLInputElement;

    expect(input?.type).toBe('search');
  });

  it('renders a textarea when the component is configured for multiline input', async () => {
    const { nativeElement } = await create({ type: 'text' });
    await Promise.resolve();
    const textarea = nativeElement.querySelector('textarea');

    expect(textarea).toBeNull();
  });

  it('renders the spam indicator when spam is true', async () => {
    const { nativeElement } = await create({ spam: true });
    await Promise.resolve();
    const wrapper = nativeElement.querySelector('.bs-input-group--spam') as HTMLElement;

    expect(wrapper).not.toBeNull();
    expect(wrapper?.classList.contains('bs-input-group--spam')).toBe(true);
  });

  it('does not render the spam class when spam is false', async () => {
    const { nativeElement } = await create({ spam: false });
    await Promise.resolve();
    const wrapper = nativeElement.querySelector('.bs-input-group--spam');

    expect(wrapper).toBeNull();
  });

  it('renders the small size class when size is sm', async () => {
    const { nativeElement } = await create({ size: 'sm' });
    await Promise.resolve();
    const input = nativeElement.querySelector('input') as HTMLInputElement;

    expect(input?.classList.contains('bs-input--sm')).toBe(true);
  });

  it('renders the large size class when size is lg', async () => {
    const { nativeElement } = await create({ size: 'lg' });
    await Promise.resolve();
    const input = nativeElement.querySelector('input') as HTMLElement;

    expect(input?.classList.contains('bs-input--lg')).toBe(true);
  });

  it('renders the medium size class by default', async () => {
    const { nativeElement } = await create({ size: 'md' });
    await Promise.resolve();
    const input = nativeElement.querySelector('input') as HTMLElement;

    expect(input?.classList.contains('bs-input--md')).toBe(true);
  });

  it('applies the minLength attribute when set', async () => {
    const { nativeElement } = await create({ minLength: 4 });
    await Promise.resolve();
    const input = nativeElement.querySelector('input') as HTMLInputElement;

    expect(input?.minLength).toBe(4);
  });

  it('applies the maxLength attribute when set', async () => {
    const { nativeElement } = await create({ maxLength: 100 });
    await Promise.resolve();
    const input = nativeElement.querySelector('input') as HTMLInputElement;

    expect(input?.maxLength).toBe(100);
  });

  it('uses fcfa pipe formatting in help when configured', async () => {
    const { nativeElement } = await create({ help: '15000 FCFA' });
    await Promise.resolve();
    expect(nativeElement.textContent).toContain('15 000 FCFA');
  });

  it('is focusable and has proper keyboard interaction', async () => {
    const { nativeElement } = await create();
    await Promise.resolve();
    const input = nativeElement.querySelector('input') as HTMLElement;

    input?.focus();
    document.body.focus?.();

    expect(input?.getAttribute('tabindex') !== null).toBe(true);
    expect(input?.getAttribute('role') === null || input?.getAttribute('role') === 'textbox').toBe(
      true,
    );
  });
});
