import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { TabsComponent, type TabItem } from './tabs.component';

const tabs: TabItem[] = [
  { id: 'description', label: 'Description' },
  { id: 'delivery', label: 'Livraison' },
  { id: 'returns', label: 'Retours' },
];

describe('TabsComponent', () => {
  async function create(activeId = 'description', list: TabItem[] = tabs) {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [TabsComponent] });
    const fixture = TestBed.createComponent(TabsComponent);
    fixture.componentRef.setInput('tabs', list);
    fixture.componentRef.setInput('activeId', activeId);
    fixture.detectChanges();
    await fixture.whenStable();
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  it('rend les onglets avec les rôles ARIA', async () => {
    const { element } = await create();

    expect(element.querySelector('[role="tablist"]')).not.toBeNull();
    expect(element.querySelectorAll('[role="tab"]').length).toBe(3);
    expect(element.querySelectorAll('[role="tab"]')[0]?.getAttribute('aria-selected')).toBe('true');
    expect(element.querySelectorAll('[role="tab"]')[0]?.getAttribute('aria-controls')).toContain(
      'panel-description',
    );
  });

  it('émet le changement au clic', async () => {
    const { fixture, element } = await create();
    let selected = '';
    fixture.componentInstance.tabChange.subscribe((id) => (selected = id));

    (element.querySelectorAll('[role="tab"]')[1] as HTMLButtonElement).click();

    expect(selected).toBe('delivery');
  });

  it('n’émet pas pour l’onglet déjà actif', async () => {
    const { fixture, element } = await create();
    let calls = 0;
    fixture.componentInstance.tabChange.subscribe(() => (calls += 1));

    (element.querySelectorAll('[role="tab"]')[0] as HTMLButtonElement).click();

    expect(calls).toBe(0);
  });

  it('navigue au clavier avec les flèches et Home/End', async () => {
    const { fixture, element } = await create();
    const changes: string[] = [];
    fixture.componentInstance.tabChange.subscribe((id) => changes.push(id));
    const first = element.querySelectorAll('[role="tab"]')[0] as HTMLButtonElement;

    first.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    first.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    first.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));

    expect(changes).toEqual(['delivery', 'returns', 'description']);
    expect(document.activeElement?.textContent).toContain('Description');
  });
});
