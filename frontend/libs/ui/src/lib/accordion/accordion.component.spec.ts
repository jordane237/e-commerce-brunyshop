import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { AccordionComponent, type AccordionItem } from './accordion.component';

const ITEMS: readonly AccordionItem[] = [
  { id: 'q1', question: 'Première question', answer: 'Première réponse' },
  { id: 'q2', question: 'Deuxième question', answer: 'Deuxième réponse' },
];

describe('AccordionComponent', () => {
  async function create() {
    await TestBed.configureTestingModule({
      imports: [AccordionComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(AccordionComponent);
    fixture.componentRef.setInput('items', ITEMS);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture;
  }

  function panel(element: HTMLElement, index: number): HTMLElement {
    return element.querySelectorAll<HTMLElement>('.accordion__panel')[index] as HTMLElement;
  }

  it('starts closed and exposes the required ARIA relationships', async () => {
    const fixture = await create();
    const element = fixture.nativeElement as HTMLElement;
    const trigger = element.querySelector('.accordion__trigger') as HTMLButtonElement;

    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(trigger.getAttribute('aria-controls')).toBe('q1-panel');
    expect(panel(element, 0).hidden).toBe(true);
    expect(panel(element, 0).getAttribute('aria-labelledby')).toBe('q1-trigger');
    expect(element.querySelectorAll('h3')).toHaveLength(2);
  });

  it('opens one panel at a time and closes it on a second click', async () => {
    const fixture = await create();
    const element = fixture.nativeElement as HTMLElement;
    const triggers = element.querySelectorAll<HTMLButtonElement>('.accordion__trigger');

    triggers[0].click();
    fixture.detectChanges();
    expect(triggers[0].getAttribute('aria-expanded')).toBe('true');
    expect(panel(element, 0).hidden).toBe(false);

    triggers[1].click();
    fixture.detectChanges();
    expect(triggers[0].getAttribute('aria-expanded')).toBe('false');
    expect(triggers[1].getAttribute('aria-expanded')).toBe('true');
    expect(panel(element, 1).hidden).toBe(false);

    triggers[1].click();
    fixture.detectChanges();
    expect(triggers[1].getAttribute('aria-expanded')).toBe('false');
    expect(panel(element, 1).hidden).toBe(true);
  });
});
