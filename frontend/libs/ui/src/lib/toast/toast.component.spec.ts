import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ToastComponent } from './toast.component';

describe('ToastComponent', () => {
  async function create(inputs: Record<string, unknown> = {}) {
    await TestBed.configureTestingModule({ imports: [ToastComponent] }).compileComponents();
    const fixture = TestBed.createComponent(ToastComponent);
    const defaults: Record<string, unknown> = {
      message: 'Produit enregistré.',
      title: 'Succès',
      variant: 'success',
    };
    for (const [key, value] of Object.entries({ ...defaults, ...inputs })) {
      fixture.componentRef.setInput(key, value);
    }
    await fixture.whenStable();
    return fixture;
  }

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders a polite status for non-blocking messages', async () => {
    const fixture = await create();
    const toast = fixture.nativeElement.querySelector('.bs-toast') as HTMLElement;

    expect(toast.getAttribute('role')).toBe('status');
    expect(toast.getAttribute('aria-live')).toBe('polite');
    expect(toast.getAttribute('aria-atomic')).toBe('true');
    expect(toast.textContent).toContain('Succès');
    expect(toast.textContent).toContain('Produit enregistré.');
  });

  it('renders an assertive alert for errors', async () => {
    const fixture = await create({ variant: 'error', message: 'Échec de l’enregistrement.' });
    const toast = fixture.nativeElement.querySelector('.bs-toast') as HTMLElement;

    expect(toast.getAttribute('role')).toBe('alert');
    expect(toast.getAttribute('aria-live')).toBe('assertive');
  });

  it('renders nothing when the message is empty', async () => {
    const fixture = await create({ message: '' });

    expect(fixture.nativeElement.querySelector('.bs-toast')).toBeNull();
  });

  it('closes from the labelled close button and emits once', async () => {
    const fixture = await create();
    const closed = vi.fn();
    fixture.componentInstance.closed.subscribe(closed);
    const close = fixture.nativeElement.querySelector('.bs-toast__close') as HTMLButtonElement;

    expect(close.getAttribute('aria-label')).toBe('Fermer la notification');

    close.click();
    await fixture.whenStable();

    expect(closed).toHaveBeenCalledTimes(1);
    expect(fixture.nativeElement.querySelector('.bs-toast')).toBeNull();
  });

  it('hides the close button when closable is false', async () => {
    const fixture = await create({ closable: false });

    expect(fixture.nativeElement.querySelector('.bs-toast__close')).toBeNull();
  });

  it('auto-dismisses after the configured duration', async () => {
    const fixture = await create({ duration: 0 });
    const closed = vi.fn();
    fixture.componentInstance.closed.subscribe(closed);

    vi.useFakeTimers();
    fixture.componentRef.setInput('duration', 5000);
    fixture.detectChanges();

    vi.advanceTimersByTime(4999);
    expect(closed).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(closed).toHaveBeenCalledTimes(1);
  });
});
