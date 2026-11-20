import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';
import { SeoService } from '../../../core/seo.service';
import { SizeGuideComponent } from './size-guide.component';

describe('SizeGuideComponent', () => {
  async function create() {
    const seo = { setPageMeta: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [SizeGuideComponent],
      providers: [provideHttpClient(), provideRouter([]), { provide: SeoService, useValue: seo }],
    }).compileComponents();

    const fixture = TestBed.createComponent(SizeGuideComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    return { fixture, seo };
  }

  it('renders the three size tables with every seed row', async () => {
    const { fixture } = await create();
    const element = fixture.nativeElement as HTMLElement;
    const tables = element.querySelectorAll('table');

    expect(tables).toHaveLength(3);
    expect(tables[0].querySelectorAll('tbody tr')).toHaveLength(10);
    expect(tables[1].querySelectorAll('tbody tr')).toHaveLength(9);
    expect(tables[2].querySelectorAll('tbody tr')).toHaveLength(19);
    expect(element.querySelector('#hommes')?.textContent).toContain('24.5');
  });

  it('renders the measuring steps and the guidance', async () => {
    const { fixture } = await create();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelectorAll('.measure-steps li')).toHaveLength(4);
    expect(element.textContent).toContain('Entre deux pointures, choisissez la plus grande.');
  });

  it('sets the page metadata', async () => {
    const { seo } = await create();

    expect(seo.setPageMeta).toHaveBeenCalledWith(
      expect.objectContaining({ canonicalPath: '/guide-des-tailles', title: 'Guide des tailles' }),
    );
  });
});
