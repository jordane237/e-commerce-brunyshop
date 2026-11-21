import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { ReassuranceBandComponent, type ReassurancePoint } from './reassurance-band.component';

const points: ReassurancePoint[] = [
  { icon: 'check-circle', label: 'Paiement à la livraison' },
  { icon: 'refresh', label: 'Échange de pointure sous 7 jours', description: 'Sous 7 jours.' },
  { icon: 'truck', label: 'Livraison à Douala et Yaoundé' },
  { icon: 'whatsapp', label: 'Support WhatsApp' },
];

describe('ReassuranceBandComponent', () => {
  async function create(value: ReassurancePoint[] = points) {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [ReassuranceBandComponent] });
    const fixture = TestBed.createComponent(ReassuranceBandComponent);
    fixture.componentRef.setInput('points', value);
    fixture.detectChanges();
    await fixture.whenStable();
    return { element: fixture.nativeElement as HTMLElement };
  }

  it('affiche chaque engagement avec son icône', async () => {
    const { element } = await create();

    expect(element.querySelectorAll('.bs-reassurance__item')).toHaveLength(4);
    expect(element.textContent).toContain('Paiement à la livraison');
    expect(element.querySelectorAll('bruny-icon svg')).toHaveLength(4);
  });

  it('expose une région nommée et les descriptions optionnelles', async () => {
    const { element } = await create();
    const section = element.querySelector('section');

    expect(section?.getAttribute('aria-label')).toBe('Nos engagements');
    expect(element.textContent).toContain('Sous 7 jours.');
    expect(element.querySelectorAll('.bs-reassurance__description')).toHaveLength(1);
  });
});
