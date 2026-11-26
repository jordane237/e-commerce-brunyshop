import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';
import { SeoService } from '../../../core/seo.service';
import { AboutComponent } from './about.component';

describe('AboutComponent', () => {
  async function create() {
    const seo = { setPageMeta: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [AboutComponent],
      providers: [provideRouter([]), { provide: SeoService, useValue: seo }],
    }).compileComponents();

    const fixture = TestBed.createComponent(AboutComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    return { fixture, seo };
  }

  it('renders the editorial sections and their anchors', async () => {
    const { fixture } = await create();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('h1')?.textContent).toBe('La bonne paire, au bon moment.');
    for (const id of ['histoire', 'selection', 'travail', 'engagements']) {
      expect(element.querySelector(`#${id}`)).not.toBeNull();
    }
    expect(element.querySelectorAll('.about-card')).toHaveLength(3);
    expect(element.textContent).toContain('Nous préférons une paire bien choisie');
    expect(element.querySelector('a[href="/boutique"]')?.textContent).toContain(
      'Découvrir la boutique',
    );
  });

  it('sets the page metadata', async () => {
    const { seo } = await create();

    expect(seo.setPageMeta).toHaveBeenCalledWith(
      expect.objectContaining({ canonicalPath: '/a-propos', title: 'À propos' }),
    );
  });
});
