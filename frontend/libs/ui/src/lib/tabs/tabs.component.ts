import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  output,
} from '@angular/core';

export interface TabItem {
  readonly id: string;
  readonly label: string;
}

@Component({
  selector: 'bruny-tabs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tabs.component.html',
  styleUrl: './tabs.component.scss',
})
export class TabsComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly tabs = input.required<readonly TabItem[]>();
  readonly activeId = input.required<string>();
  readonly ariaLabel = input('Sections');
  readonly idPrefix = input('bs-tab');

  readonly tabChange = output<string>();

  tabId(tab: TabItem): string {
    return `${this.idPrefix()}-${tab.id}`;
  }

  panelId(tab: TabItem): string {
    return `${this.idPrefix()}-panel-${tab.id}`;
  }

  isActive(tab: TabItem): boolean {
    return tab.id === this.activeId();
  }

  select(tab: TabItem): void {
    if (!this.isActive(tab)) this.tabChange.emit(tab.id);
  }

  onKeydown(event: KeyboardEvent, index: number): void {
    const keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'];
    if (!keys.includes(event.key)) return;

    event.preventDefault();
    const tabs = this.tabs();
    if (tabs.length === 0) return;

    let nextIndex = index;
    if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = tabs.length - 1;
    else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = (index + 1) % tabs.length;
    } else {
      nextIndex = (index - 1 + tabs.length) % tabs.length;
    }

    const next = tabs[nextIndex];
    if (next === undefined) return;
    this.tabChange.emit(next.id);

    const button = this.host.nativeElement.querySelector<HTMLButtonElement>(`#${this.tabId(next)}`);
    button?.focus();
  }
}
