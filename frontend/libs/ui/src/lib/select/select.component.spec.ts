import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { SelectComponent, type SelectOption } from './select.component';

const OPTIONS: SelectOption[] = [
  { value: 'noir', label: 'Noir' },
  { value: 'marron', label: 'Marron' },
  { value: 'bordeaux', label: 'Bordeaux', disabled: true },
];

describe('SelectComponent', () => {
  async function create(inputs: Record<string, unknown> = {}) {
    await TestBed.configureTestingModule({ imports: [SelectComponent] }).compileComponents();
    const fixture = TestBed.createComponent(SelectComponent);
    const defaults: Record<string, unknown> = {
      label: 'Couleur',
      name: 'color',
      id: 'color',
      options: OPTIONS,
    };
    for (const [key, value] of Object.entries({ ...defaults, ...inputs })) {
      fixture.componentRef.setInput(key, value);
    }
    await fixture.whenStable();
    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    return { fixture, select };
  }

  it('associates the label and options with the native select', async () => {
    const { fixture, select } = await create();
    const label = fixture.nativeElement.querySelector('label') as HTMLLabelElement;

    expect(label.getAttribute('for')).toBe('color');
    expect(select.id).toBe('color');
    expect(select.name).toBe('color');
    expect(Array.from(select.options).map((option) => option.textContent?.trim())).toEqual([
      'Sélectionner…',
      'Noir',
      'Marron',
      'Bordeaux',
    ]);
  });

  it('links the hint with aria-describedby', async () => {
    const { fixture, select } = await create({ hint: 'Choisissez une teinte.' });

    expect(select.getAttribute('aria-describedby')).toBe('color-hint');
    expect(fixture.nativeElement.querySelector('#color-hint')?.textContent).toContain(
      'Choisissez une teinte.',
    );
  });

  it('announces an error with aria-invalid and role=alert', async () => {
    const { fixture, select } = await create({ error: 'Couleur obligatoire.' });
    const error = fixture.nativeElement.querySelector('#color-error') as HTMLElement;

    expect(select.getAttribute('aria-invalid')).toBe('true');
    expect(select.getAttribute('aria-describedby')).toBe('color-error');
    expect(error.getAttribute('role')).toBe('alert');
    expect(error.textContent).toContain('Couleur obligatoire.');
  });

  it('marks required fields and disables the placeholder', async () => {
    const { fixture, select } = await create({ required: true });
    const label = fixture.nativeElement.querySelector('label') as HTMLLabelElement;

    expect(select.required).toBe(true);
    expect(select.getAttribute('aria-required')).toBe('true');
    expect(label.textContent).toContain('*');
    expect((select.options[0] as HTMLOptionElement).disabled).toBe(true);
  });

  it('emits the selected value on change', async () => {
    const { fixture, select } = await create();
    const values: string[] = [];
    fixture.componentInstance.valueChange.subscribe((value) => values.push(value));

    select.value = 'marron';
    select.dispatchEvent(new Event('change', { bubbles: true }));

    expect(values).toEqual(['marron']);
    expect(fixture.componentInstance.value).toBe('marron');
  });

  it('disables the select when disabled or loading', async () => {
    const { fixture, select } = await create();
    expect(select.disabled).toBe(false);

    fixture.componentRef.setInput('loading', true);
    await fixture.whenStable();
    expect(select.disabled).toBe(true);
    expect(fixture.nativeElement.querySelector('bruny-spinner')).not.toBeNull();

    fixture.componentRef.setInput('loading', false);
    fixture.componentRef.setInput('disabled', true);
    await fixture.whenStable();
    expect(select.disabled).toBe(true);
    expect(fixture.nativeElement.querySelector('bruny-spinner')).toBeNull();
  });
});
