import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ModalComponent } from './modal.component';

describe('ModalComponent', () => {
  async function create(open = true) {
    await TestBed.configureTestingModule({ imports: [ModalComponent] }).compileComponents();
    const fixture = TestBed.createComponent(ModalComponent);
    fixture.componentRef.setInput('title', 'Supprimer le produit');
    fixture.componentRef.setInput('id', 'delete-product');
    fixture.componentRef.setInput('open', open);
    await fixture.whenStable();
    return fixture;
  }

  afterEach(() => {
    document.body.style.overflow = '';
  });

  it('exposes an accessible dialog with a labelled title', async () => {
    const fixture = await create();
    const dialog = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;
    const title = fixture.nativeElement.querySelector('#delete-product-title') as HTMLElement;
    const close = fixture.nativeElement.querySelector('.bs-modal__close') as HTMLButtonElement;

    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-labelledby')).toBe('delete-product-title');
    expect(title.textContent).toContain('Supprimer le produit');
    expect(close.getAttribute('aria-label')).toBe('Fermer la fenêtre');
  });

  it('closes on Escape, emits both events and restores the page scroll', async () => {
    const fixture = await create();
    const openChanges: boolean[] = [];
    const closed = vi.fn();
    fixture.componentInstance.openChange.subscribe((value) => openChanges.push(value));
    fixture.componentInstance.closed.subscribe(closed);

    expect(document.body.style.overflow).toBe('hidden');

    const dialog = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;
    dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await fixture.whenStable();

    expect(openChanges).toEqual([false]);
    expect(closed).toHaveBeenCalledTimes(1);
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
    expect(document.body.style.overflow).toBe('');
  });

  it('closes on backdrop only when closeOnBackdrop is enabled', async () => {
    const fixture = await create();
    const backdrop = fixture.nativeElement.querySelector('.bs-modal__overlay') as HTMLElement;

    fixture.componentRef.setInput('closeOnBackdrop', false);
    await fixture.whenStable();
    backdrop.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).not.toBeNull();

    fixture.componentRef.setInput('closeOnBackdrop', true);
    await fixture.whenStable();
    backdrop.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
  });

  it('returns focus to the element that opened it', async () => {
    const trigger = document.createElement('button');
    trigger.textContent = 'Ouvrir';
    document.body.appendChild(trigger);
    trigger.focus();

    const fixture = await create();
    const dialog = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;
    dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await fixture.whenStable();

    expect(document.activeElement).toBe(trigger);

    trigger.remove();
  });

  it('does not close when clicking inside the dialog', async () => {
    const fixture = await create();
    const title = fixture.nativeElement.querySelector('.bs-modal__title') as HTMLElement;

    title.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('[role="dialog"]')).not.toBeNull();
  });
});
