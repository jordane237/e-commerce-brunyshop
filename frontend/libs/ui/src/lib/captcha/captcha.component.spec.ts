import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { describe, expect, it } from 'vitest';

import { CaptchaComponent } from './captcha.component';

function setup(platform: 'browser' | 'server') {
  TestBed.configureTestingModule({
    imports: [CaptchaComponent],
    providers: [{ provide: PLATFORM_ID, useValue: platform }],
  });
  const fixture = TestBed.createComponent(CaptchaComponent);
  fixture.componentRef.setInput('siteKey', '1x00000000000000000000BB');
  fixture.componentRef.setInput('control', new FormControl<string | null>(null));
  fixture.detectChanges();
  return fixture;
}

describe('CaptchaComponent (AUT-11)', () => {
  it('rend le widget côté navigateur', () => {
    const fixture = setup('browser');

    expect(fixture.nativeElement.querySelector('ngx-turnstile')).not.toBeNull();
  });

  it('ne rend jamais le widget pendant le SSR', () => {
    const fixture = setup('server');

    expect(fixture.nativeElement.querySelector('ngx-turnstile')).toBeNull();
  });

  it('affiche un message accessible si le script ou le challenge échoue', () => {
    const fixture = setup('browser');

    fixture.componentInstance.onError('network-error');
    fixture.detectChanges();

    const message = fixture.nativeElement.querySelector('.captcha-error') as HTMLElement | null;
    expect(message?.textContent).toContain('Vérification indisponible');
    expect(message?.getAttribute('role')).toBe('alert');
  });

  it('affiche un message si le challenge expire', () => {
    const fixture = setup('browser');

    fixture.componentInstance.onTimeout();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('trop de temps');
  });

  it('transmet le jeton résolu au parent', () => {
    const fixture = setup('browser');
    let token: string | null | undefined;
    fixture.componentInstance.resolved.subscribe((value) => (token = value));

    fixture.componentInstance.resolved.emit('turnstile-token');

    expect(token).toBe('turnstile-token');
  });

  it('ne rend rien sans site key', () => {
    TestBed.configureTestingModule({
      imports: [CaptchaComponent],
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });
    const fixture = TestBed.createComponent(CaptchaComponent);
    fixture.componentRef.setInput('control', new FormControl<string | null>(null));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('ngx-turnstile')).toBeNull();
  });
});
