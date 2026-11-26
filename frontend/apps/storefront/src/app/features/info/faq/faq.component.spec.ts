import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';
import { SeoService } from '../../../core/seo.service';
import { FaqComponent } from './faq.component';

describe('FaqComponent', () => {
  async function create() {
    const seo = { setPageMeta: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [FaqComponent],
      providers: [provideRouter([]), { provide: SeoService, useValue: seo }],
    }).compileComponents();

    const fixture = TestBed.createComponent(FaqComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    return { fixture, seo };
  }

  it('renders the five categories and all 18 questions', async () => {
    const { fixture } = await create();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelectorAll('bruny-accordion')).toHaveLength(5);
    expect(element.querySelectorAll('.accordion__trigger')).toHaveLength(18);
    expect(element.textContent).toContain('Comment passer commande ?');
    expect(element.textContent).toContain('Comment supprimer mon compte ?');
  });

  it('links the contact block to the support email', async () => {
    const { fixture } = await create();
    const element = fixture.nativeElement as HTMLElement;
    const action = element.querySelector('.faq-contact__action') as HTMLAnchorElement;

    expect(action.getAttribute('href')).toContain('mailto:support@brunyshop.cm');
    expect(element.textContent).toContain('Vous ne trouvez pas votre réponse ?');
  });

  it('sets the page metadata', async () => {
    const { seo } = await create();

    expect(seo.setPageMeta).toHaveBeenCalledWith(
      expect.objectContaining({ canonicalPath: '/faq', title: 'Questions fréquentes' }),
    );
  });
});
