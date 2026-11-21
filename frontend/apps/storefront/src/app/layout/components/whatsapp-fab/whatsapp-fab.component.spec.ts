import { signal, type WritableSignal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { NavigationEnd, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { APP_CONFIG, DEFAULT_APP_CONFIG } from '../../../core/app-config';
import { ConsentService } from '../../../core/services/consent.service';
import { WhatsAppFabComponent } from './whatsapp-fab.component';

interface CreateOptions {
  readonly url?: string;
  readonly showBanner?: boolean;
  readonly contactWhatsappUrl?: string;
}

function create(options: CreateOptions = {}): {
  fixture: ComponentFixture<WhatsAppFabComponent>;
  events: Subject<NavigationEnd>;
  showBanner: WritableSignal<boolean>;
} {
  const events = new Subject<NavigationEnd>();
  const showBanner = signal(options.showBanner ?? false);
  const router = {
    url: options.url ?? '/',
    events: events.asObservable(),
  };

  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [WhatsAppFabComponent],
    providers: [
      { provide: Router, useValue: router },
      {
        provide: ConsentService,
        useValue: { showBanner: showBanner.asReadonly() },
      },
      {
        provide: APP_CONFIG,
        useValue: {
          ...DEFAULT_APP_CONFIG,
          contactWhatsappUrl: options.contactWhatsappUrl ?? DEFAULT_APP_CONFIG.contactWhatsappUrl,
        },
      },
    ],
  });

  const fixture = TestBed.createComponent(WhatsAppFabComponent);
  fixture.detectChanges();
  return { fixture, events, showBanner };
}

function anchorOf(fixture: ComponentFixture<WhatsAppFabComponent>): HTMLAnchorElement | null {
  return (fixture.nativeElement as HTMLElement).querySelector<HTMLAnchorElement>('a.whatsapp-fab');
}

function messageOf(anchor: HTMLAnchorElement): string {
  const href = anchor.getAttribute('href') ?? '';
  return new URL(href).searchParams.get('text') ?? '';
}

describe('WhatsAppFabComponent', () => {
  it('affiche le FAB sur l’accueil avec le message contextuel', () => {
    const { fixture } = create();
    const anchor = anchorOf(fixture);

    expect(anchor).not.toBeNull();
    expect(messageOf(anchor as HTMLAnchorElement)).toContain(
      "je visite votre boutique et j'ai une question.",
    );
  });

  it('met à jour le contexte après une navigation', () => {
    const { fixture, events } = create();

    events.next(new NavigationEnd(1, '/boutique', '/boutique'));
    fixture.detectChanges();

    const anchor = anchorOf(fixture);
    expect(anchor).not.toBeNull();
    expect(messageOf(anchor as HTMLAnchorElement)).toContain('je parcours votre boutique');
  });

  it('masque le FAB dans le tunnel de paiement', () => {
    const { fixture } = create({ url: '/commande/paiement' });

    expect(anchorOf(fixture)).toBeNull();
  });

  it('masque le FAB sur la page contact', () => {
    const { fixture } = create({ url: '/contact' });

    expect(anchorOf(fixture)).toBeNull();
  });

  it('masque le FAB tant que le bandeau de consentement est ouvert', () => {
    const { fixture, showBanner } = create({ showBanner: true });

    expect(anchorOf(fixture)).toBeNull();

    showBanner.set(false);
    fixture.detectChanges();

    expect(anchorOf(fixture)).not.toBeNull();
  });

  it('ne rend aucun lien si la configuration WhatsApp est invalide', () => {
    const { fixture } = create({ contactWhatsappUrl: 'https://wa.me/CHANGEME' });

    expect(anchorOf(fixture)).toBeNull();
  });

  it('expose les attributs d’accessibilité et l’infobulle', () => {
    const { fixture } = create();
    const anchor = anchorOf(fixture) as HTMLAnchorElement;

    expect(anchor.getAttribute('target')).toBe('_blank');
    expect(anchor.getAttribute('rel')).toBe('noopener noreferrer');
    expect(anchor.getAttribute('aria-label')).toBe(
      'Contacter le support sur WhatsApp (nouvel onglet)',
    );
    expect(anchor.getAttribute('aria-describedby')).toBe('whatsapp-fab-tooltip');

    const tooltip = anchor.querySelector('#whatsapp-fab-tooltip');
    expect(tooltip?.getAttribute('role')).toBe('tooltip');
    expect(tooltip?.textContent).toContain('Discuter sur WhatsApp');

    const icon = anchor.querySelector('svg');
    expect(icon?.getAttribute('aria-hidden')).toBe('true');
    expect(icon?.getAttribute('focusable')).toBe('false');
  });

  it('marque le FAB sur une fiche produit pour le masquage mobile CSS', () => {
    const { fixture } = create({ url: '/produit/mocassin-cuir' });
    const anchor = anchorOf(fixture) as HTMLAnchorElement;

    expect(anchor.classList.contains('whatsapp-fab--product')).toBe(true);
  });
});
