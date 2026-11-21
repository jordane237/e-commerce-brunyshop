import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';
import { ConsentService, type ConsentPreferences } from '../../../core/services/consent.service';
import { ConsentBannerComponent } from './consent-banner.component';

function create(preferences: ConsentPreferences | null = null) {
  const showBanner = signal(true);
  const preferencesState = signal<ConsentPreferences | null>(preferences);
  const consent = {
    showBanner: showBanner.asReadonly(),
    preferences: preferencesState.asReadonly(),
    acceptAll: vi.fn(() => showBanner.set(false)),
    rejectAll: vi.fn(() => showBanner.set(false)),
    customize: vi.fn(() => showBanner.set(false)),
  };

  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [ConsentBannerComponent],
    providers: [provideRouter([]), { provide: ConsentService, useValue: consent }],
  });

  const fixture = TestBed.createComponent(ConsentBannerComponent);
  fixture.detectChanges();
  return { fixture, consent, showBanner };
}

function buttonByText(element: HTMLElement, text: string): HTMLButtonElement | undefined {
  return Array.from(element.querySelectorAll('button')).find((button) =>
    button.textContent?.includes(text),
  );
}

describe('ConsentBannerComponent', () => {
  it('affiche le bandeau au premier accès', () => {
    const { fixture } = create();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('#consent-title')?.textContent).toContain(
      'Nous respectons votre vie privée',
    );
    expect(buttonByText(element, 'Accepter')).toBeDefined();
    expect(buttonByText(element, 'Refuser')).toBeDefined();
    expect(buttonByText(element, 'Personnaliser')).toBeDefined();
  });

  it('appelle acceptAll au clic sur Accepter', () => {
    const { fixture, consent } = create();

    buttonByText(fixture.nativeElement as HTMLElement, 'Accepter')?.click();

    expect(consent.acceptAll).toHaveBeenCalledOnce();
  });

  it('appelle rejectAll au clic sur Refuser', () => {
    const { fixture, consent } = create();

    buttonByText(fixture.nativeElement as HTMLElement, 'Refuser')?.click();

    expect(consent.rejectAll).toHaveBeenCalledOnce();
  });

  it('ouvre les préférences avec les choix existants', () => {
    const { fixture } = create({
      necessary: true,
      analytics: false,
      marketing: true,
      version: '1.0',
      updatedAt: new Date().toISOString(),
    });

    buttonByText(fixture.nativeElement as HTMLElement, 'Personnaliser')?.click();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('[role="dialog"]')).not.toBeNull();
    expect(fixture.componentInstance.marketingEnabled()).toBe(true);
    expect(element.textContent).toContain('Gérer mes préférences');
  });

  it('enregistre les préférences personnalisées', () => {
    const { fixture, consent } = create();
    const component = fixture.componentInstance;

    component.onCustomize();
    component.analyticsEnabled.set(true);
    component.marketingEnabled.set(false);
    component.onSaveCustom();

    expect(consent.customize).toHaveBeenCalledWith({ analytics: true, marketing: false });
    expect(component.customizeOpen()).toBe(false);
  });

  it('referme la modale sans enregistrer', () => {
    const { fixture, consent } = create();
    const component = fixture.componentInstance;

    component.onCustomize();
    component.onCancelCustom();

    expect(component.customizeOpen()).toBe(false);
    expect(consent.customize).not.toHaveBeenCalled();
  });
});
