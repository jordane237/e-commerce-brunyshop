import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';
import { SeoService } from '../../../core/seo.service';
import { PrivacyComponent } from './privacy.component';

describe('PrivacyComponent', () => {
  async function create() {
    const seo = { setPageMeta: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [PrivacyComponent],
      providers: [provideRouter([]), { provide: SeoService, useValue: seo }],
    }).compileComponents();

    const fixture = TestBed.createComponent(PrivacyComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    return { fixture, seo };
  }

  it('renders the legal sections including Turnstile', async () => {
    const { fixture } = await create();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelectorAll('section')).toHaveLength(11);
    expect(element.querySelector('#turnstile')?.textContent).toContain('Cloudflare Turnstile');
    expect(element.textContent).toContain('Responsable du traitement');
    expect(element.textContent).toContain('Durées de conservation');
  });

  it('renders the purposes table with a caption', async () => {
    const { fixture } = await create();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelectorAll('tbody tr')).toHaveLength(6);
    expect(element.querySelector('caption')?.textContent).toContain('Finalités et bases légales');
  });

  it('sets the page metadata', async () => {
    const { seo } = await create();

    expect(seo.setPageMeta).toHaveBeenCalledWith(
      expect.objectContaining({
        canonicalPath: '/politique-confidentialite',
        title: 'Politique de confidentialité',
      }),
    );
  });
});
