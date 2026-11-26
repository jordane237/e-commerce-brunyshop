import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';
import { SeoService } from '../../../core/seo.service';
import { LegalNoticeComponent } from './legal-notice.component';

describe('LegalNoticeComponent', () => {
  async function create() {
    const seo = { setPageMeta: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [LegalNoticeComponent],
      providers: [provideRouter([]), { provide: SeoService, useValue: seo }],
    }).compileComponents();

    const fixture = TestBed.createComponent(LegalNoticeComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    return { fixture, seo };
  }

  it('renders the six legal sections and the editor identity', async () => {
    const { fixture } = await create();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelectorAll('section')).toHaveLength(6);
    expect(element.textContent).toContain('BRUNY SHOPPING SARL');
    expect(element.textContent).toContain('Douala');
    expect(element.textContent).toContain('Directeur de la publication');
  });

  it('shows the owner placeholders explicitly', async () => {
    const { fixture } = await create();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelectorAll('.legal-field').length).toBeGreaterThanOrEqual(6);
    expect(element.textContent).toContain('[À fournir par le propriétaire]');
    expect(element.textContent).toContain('validées par un juriste');
  });

  it('sets the page metadata', async () => {
    const { seo } = await create();

    expect(seo.setPageMeta).toHaveBeenCalledWith(
      expect.objectContaining({ canonicalPath: '/mentions-legales', title: 'Mentions légales' }),
    );
  });
});
