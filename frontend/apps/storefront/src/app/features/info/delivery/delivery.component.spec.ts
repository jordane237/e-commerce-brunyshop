import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';
import { SeoService } from '../../../core/seo.service';
import { DeliveryComponent } from './delivery.component';

describe('DeliveryComponent', () => {
  async function create() {
    const seo = { setPageMeta: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [DeliveryComponent],
      providers: [provideRouter([]), { provide: SeoService, useValue: seo }],
    }).compileComponents();

    const fixture = TestBed.createComponent(DeliveryComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    return { fixture, seo };
  }

  it('renders the five delivery zones in a labelled table and mobile cards', async () => {
    const { fixture } = await create();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelectorAll('tbody tr')).toHaveLength(5);
    expect(element.querySelector('caption')?.textContent).toContain('Zones, délais et frais');
    expect(element.querySelectorAll('.zone-card')).toHaveLength(5);
    expect(element.textContent).toContain('1 500 FCFA');
    expect(element.textContent).toContain('5 jours ouvrés');
  });

  it('renders the process, the payment callout and the short FAQ', async () => {
    const { fixture } = await create();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelectorAll('.delivery-steps li')).toHaveLength(4);
    expect(element.textContent).toContain('Aucun paiement n’est demandé avant la remise.');
    expect(element.querySelectorAll('bruny-accordion .accordion__trigger')).toHaveLength(3);
  });

  it('sets the page metadata', async () => {
    const { seo } = await create();

    expect(seo.setPageMeta).toHaveBeenCalledWith(
      expect.objectContaining({ canonicalPath: '/livraison', title: 'Livraison' }),
    );
  });
});
