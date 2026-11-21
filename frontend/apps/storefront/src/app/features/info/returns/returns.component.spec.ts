import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';
import { SeoService } from '../../../core/seo.service';
import { ReturnsComponent } from './returns.component';

describe('ReturnsComponent', () => {
  async function create() {
    const seo = { setPageMeta: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [ReturnsComponent],
      providers: [provideRouter([]), { provide: SeoService, useValue: seo }],
    }).compileComponents();

    const fixture = TestBed.createComponent(ReturnsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    return { fixture, seo };
  }

  it('renders the four essentials and both eligibility lists', async () => {
    const { fixture } = await create();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelectorAll('.returns-essentials li')).toHaveLength(4);
    expect(element.querySelectorAll('.returns-verdict--yes li')).toHaveLength(4);
    expect(element.querySelectorAll('.returns-verdict--no li')).toHaveLength(2);
    expect(element.textContent).toContain('7 jours après réception');
    expect(element.textContent).toContain('articles d’hygiène ou personnalisés');
  });

  it('renders the procedure and the return request action', async () => {
    const { fixture } = await create();
    const element = fixture.nativeElement as HTMLElement;
    const action = element.querySelector('a[href^="mailto:"]') as HTMLAnchorElement;

    expect(element.querySelectorAll('.returns-steps li')).toHaveLength(4);
    expect(action.getAttribute('href')).toContain('Un retour ou un échange');
    expect(action.textContent).toContain('Demander un retour');
  });

  it('sets the page metadata', async () => {
    const { seo } = await create();

    expect(seo.setPageMeta).toHaveBeenCalledWith(
      expect.objectContaining({ canonicalPath: '/retours', title: 'Retours et échanges' }),
    );
  });
});
