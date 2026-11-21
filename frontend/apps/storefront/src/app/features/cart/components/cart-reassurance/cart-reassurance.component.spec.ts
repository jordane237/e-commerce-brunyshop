import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { CartReassuranceComponent, type ReassurancePoint } from './cart-reassurance.component';

const points: ReassurancePoint[] = [
  {
    icon: 'check-circle',
    label: 'Paiement à la livraison',
    description: 'Payez une fois la paire reçue.',
  },
  { icon: 'refresh', label: 'Échange sous 7 jours' },
  { icon: 'truck', label: 'Livraison à Douala et Yaoundé' },
  { icon: 'whatsapp', label: 'Support WhatsApp' },
];

describe('CartReassuranceComponent', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  async function create(value: ReassurancePoint[] = points) {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [CartReassuranceComponent] });
    const fixture = TestBed.createComponent(CartReassuranceComponent);
    fixture.componentRef.setInput('points', value);
    fixture.detectChanges();
    await fixture.whenStable();
    return { element: fixture.nativeElement as HTMLElement };
  }

  it('affiche chaque engagement avec son icône', async () => {
    const { element } = await create();

    expect(element.querySelectorAll('.cart-reassurance__item')).toHaveLength(4);
    expect(element.textContent).toContain('Paiement à la livraison');
    expect(element.textContent).toContain('Échange sous 7 jours');
    expect(element.textContent).toContain('Support WhatsApp');
    expect(element.querySelectorAll('bruny-icon svg')).toHaveLength(4);
  });

  it('expose une région accessible et des descriptions optionnelles', async () => {
    const { element } = await create();
    const section = element.querySelector('section');

    expect(section?.getAttribute('aria-label')).toBe('Nos engagements');
    expect(element.textContent).toContain('Payez une fois la paire reçue.');
    expect(element.querySelectorAll('.cart-reassurance__description')).toHaveLength(1);
  });
});
