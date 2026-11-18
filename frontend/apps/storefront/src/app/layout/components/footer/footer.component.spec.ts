import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';
import { ConsentService } from '../../../core/services/consent.service';
import { FooterComponent } from './footer.component';

describe('FooterComponent', () => {
  async function create() {
    const consent = { openBanner: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [FooterComponent],
      providers: [provideRouter([]), { provide: ConsentService, useValue: consent }],
    }).compileComponents();

    const fixture = TestBed.createComponent(FooterComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    return { fixture, consent };
  }

  it('exposes the information, help and legal navigation', async () => {
    const { fixture } = await create();
    const element = fixture.nativeElement as HTMLElement;
    const hrefs = Array.from(element.querySelectorAll('a')).map((link) =>
      link.getAttribute('href'),
    );

    expect(element.querySelectorAll('nav')).toHaveLength(3);
    expect(hrefs).toEqual(
      expect.arrayContaining([
        '/boutique',
        '/panier',
        '/contact',
        '/faq',
        '/livraison',
        '/retours',
        '/guide-des-tailles',
        '/a-propos',
        '/cgv',
        '/politique-confidentialite',
        '/mentions-legales',
        'mailto:support@brunyshop.cm',
      ]),
    );
    expect(element.textContent).toContain('Paiement à la livraison');
  });

  it('renders a copyright with the current year', async () => {
    const { fixture } = await create();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('.site-footer__bottom')?.textContent).toContain(
      `© ${new Date().getFullYear()} BRUNY SHOPPING`,
    );
  });

  it('rouvre le bandeau depuis « Gérer mes préférences cookies »', async () => {
    const { fixture, consent } = await create();
    const button = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('button'),
    ).find((item) => item.textContent?.includes('Gérer mes préférences cookies'));

    button?.click();

    expect(consent.openBanner).toHaveBeenCalledOnce();
  });
});
