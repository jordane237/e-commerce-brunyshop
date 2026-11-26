import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { DrawerComponent } from './drawer.component';

async function tick(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

@Component({
  standalone: true,
  imports: [DrawerComponent],
  template: `
    <button class="host-trigger" type="button" (click)="open.set(true)">Ouvrir</button>
    <bruny-drawer
      title="Mon panier"
      closeLabel="Fermer le panier"
      [isOpen]="open()"
      (isOpenChange)="open.set($event)"
    >
      <div drawer-body><a href="/panier">Voir le panier</a></div>
      <div drawer-footer><button type="button">Action</button></div>
    </bruny-drawer>
  `,
})
class DrawerHostComponent {
  readonly open = signal(false);
}

describe('DrawerComponent', () => {
  let fixture: ComponentFixture<unknown> | null = null;

  afterEach(() => {
    fixture?.destroy();
    fixture = null;
    document.body.style.overflow = '';
  });

  async function create(open = false) {
    await TestBed.configureTestingModule({ imports: [DrawerComponent] }).compileComponents();
    const created = TestBed.createComponent(DrawerComponent);
    created.componentRef.setInput('title', 'Mon panier');
    created.componentRef.setInput('closeLabel', 'Fermer le panier');
    created.detectChanges();
    await created.whenStable();
    await tick();
    if (open) {
      created.componentRef.setInput('isOpen', true);
      created.detectChanges();
      await created.whenStable();
      await tick();
      created.detectChanges();
    }
    fixture = created;
    return created;
  }

  function dialog(): HTMLElement | null {
    return document.querySelector('.bruny-drawer');
  }

  it('does not render anything while closed', async () => {
    await create(false);
    expect(dialog()).toBeNull();
  });

  it('renders an accessible dialog with the right-side overlay', async () => {
    const created = await create(true);
    const element = dialog();
    const title = element?.querySelector('.bruny-drawer__title') as HTMLElement;
    const close = element?.querySelector('.bruny-drawer__close') as HTMLButtonElement;

    expect(element).not.toBeNull();
    expect(element?.getAttribute('role')).toBe('dialog');
    expect(element?.getAttribute('aria-modal')).toBe('true');
    expect(element?.getAttribute('aria-labelledby')).toBe(created.componentInstance.titleId);
    expect(title.textContent).toContain('Mon panier');
    expect(close.getAttribute('aria-label')).toBe('Fermer le panier');
    expect(document.querySelector('.cdk-overlay-backdrop')).not.toBeNull();
  });

  it('projects body and footer content into the drawer', async () => {
    await TestBed.configureTestingModule({ imports: [DrawerHostComponent] }).compileComponents();
    const created = TestBed.createComponent(DrawerHostComponent);
    fixture = created;
    created.detectChanges();
    await created.whenStable();

    created.componentInstance.open.set(true);
    created.detectChanges();
    await created.whenStable();
    await tick();
    created.detectChanges();

    expect(dialog()?.textContent).toContain('Voir le panier');
    expect(dialog()?.textContent).toContain('Action');
  });

  it('closes on Escape and restores focus to the trigger', async () => {
    const trigger = document.createElement('button');
    trigger.textContent = 'Ouvrir le panier';
    document.body.appendChild(trigger);
    trigger.focus();

    const created = await create(true);
    await tick();

    const element = dialog();
    element?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await created.whenStable();
    await tick();

    expect(created.componentInstance.isOpen()).toBe(false);
    expect(dialog()).toBeNull();
    expect(document.activeElement).toBe(trigger);

    trigger.remove();
  });

  it('closes on backdrop click unless disabled', async () => {
    const created = await create(false);
    created.componentRef.setInput('closeOnBackdrop', false);
    created.componentRef.setInput('isOpen', true);
    created.detectChanges();
    await created.whenStable();
    await tick();

    const backdrop = document.querySelector('.cdk-overlay-backdrop') as HTMLElement;
    backdrop.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await created.whenStable();
    expect(dialog()).not.toBeNull();

    created.componentRef.setInput('closeOnBackdrop', true);
    created.detectChanges();
    backdrop.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await created.whenStable();
    expect(dialog()).toBeNull();
  });
});
