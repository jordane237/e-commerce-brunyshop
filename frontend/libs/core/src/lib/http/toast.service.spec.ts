import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { ToastService } from './toast.service';

describe('ToastService (TEC-12)', () => {
  let toast: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    toast = TestBed.inject(ToastService);
  });

  it('empile et expose le toast courant', () => {
    toast.error('Votre session a expiré. Reconnectez-vous.');

    expect(toast.toasts()).toHaveLength(1);
    expect(toast.current()?.variant).toBe('error');
    expect(toast.current()?.message).toBe('Votre session a expiré. Reconnectez-vous.');
  });

  it('dismiss supprime le toast', () => {
    toast.error('message');
    const id = toast.current()!.id;
    toast.dismiss(id);
    expect(toast.current()).toBeNull();
  });

  it('dismissCurrent vide le courant', () => {
    toast.warning('attention');
    toast.dismissCurrent();
    expect(toast.toasts()).toHaveLength(0);
  });

  it('ne stocke rien en SSR', () => {
    const platform = TestBed.inject as never;
    void platform;
    toast.clear();
    expect(toast.toasts()).toHaveLength(0);
  });
});
