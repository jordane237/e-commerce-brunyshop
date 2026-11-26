import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { TimelineComponent, type TimelineEntry } from './timeline.component';

describe('TimelineComponent', () => {
  async function create(entries: TimelineEntry[]) {
    await TestBed.configureTestingModule({ imports: [TimelineComponent] }).compileComponents();
    const fixture = TestBed.createComponent(TimelineComponent);
    fixture.componentRef.setInput('entries', entries);
    fixture.detectChanges();
    return fixture;
  }

  it('rend les entrées avec aria-current sur l\u2019étape courante', async () => {
    const entries: TimelineEntry[] = [
      {
        status: 'A',
        label: 'Étape 1',
        date: '2026-11-10T10:00:00.000Z',
        isCurrent: false,
        isCompleted: true,
      },
      { status: 'B', label: 'Étape 2', date: null, isCurrent: true, isCompleted: false },
      { status: 'C', label: 'Étape 3', date: null, isCurrent: false, isCompleted: false },
    ];
    const fixture = await create(entries);
    const el = fixture.nativeElement as HTMLElement;
    const items = el.querySelectorAll('li');
    expect(items).toHaveLength(3);
    const current = el.querySelector('[aria-current="step"]');
    expect(current?.textContent).toContain('Étape 2');
  });

  it('affiche un marqueur check pour les étapes terminées', async () => {
    const entries: TimelineEntry[] = [
      { status: 'A', label: 'Étape 1', date: null, isCurrent: false, isCompleted: true },
    ];
    const fixture = await create(entries);
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.timeline__item--completed')).not.toBeNull();
    expect(el.querySelector('bruny-icon')).not.toBeNull();
  });

  it('formate les dates', async () => {
    const entries: TimelineEntry[] = [
      {
        status: 'A',
        label: 'Étape 1',
        date: '2026-11-10T14:32:00.000Z',
        isCurrent: false,
        isCompleted: true,
      },
    ];
    const fixture = await create(entries);
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('10');
  });
});
