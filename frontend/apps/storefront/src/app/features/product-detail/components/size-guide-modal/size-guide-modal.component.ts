import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { components } from '@bruny/data-access';
import { CatalogApi } from '@bruny/data-access';
import {
  ButtonComponent,
  IconComponent,
  ModalComponent,
  SkeletonComponent,
  TabsComponent,
} from '@bruny/ui';
import type { TabItem } from '@bruny/ui';

type SizeGuideResponse = components['schemas']['SizeGuideResponseDto'];
type SizeGuideEntry = components['schemas']['SizeGuideEntryDto'];

@Component({
  selector: 'app-size-guide-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ModalComponent, TabsComponent, SkeletonComponent, ButtonComponent, IconComponent],
  templateUrl: './size-guide-modal.component.html',
  styleUrl: './size-guide-modal.component.scss',
})
export class SizeGuideModalComponent {
  private readonly catalogApi = inject(CatalogApi);

  readonly isOpen = model.required<boolean>();
  readonly categoryId = input.required<string>();

  private readonly _guide = signal<SizeGuideResponse | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly guide = this._guide.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly activeTab = signal<'men' | 'women' | 'kids'>('men');

  readonly availableTabs = computed<TabItem[]>(() => {
    const guide = this._guide();
    if (guide === null) return [];
    const tabs: TabItem[] = [];
    if (guide.table.men?.length) tabs.push({ id: 'men', label: 'Homme' });
    if (guide.table.women?.length) tabs.push({ id: 'women', label: 'Femme' });
    if (guide.table.kids?.length) tabs.push({ id: 'kids', label: 'Enfant' });
    return tabs;
  });

  readonly currentEntries = computed<SizeGuideEntry[]>(() => {
    const guide = this._guide();
    if (guide === null) return [];
    const tab = this.activeTab();
    return guide.table[tab] ?? [];
  });

  constructor() {
    effect(() => {
      this.categoryId();
      this._guide.set(null);
      this._error.set(null);
    });

    effect(() => {
      if (this.isOpen() && this._guide() === null && !this._loading() && this._error() === null) {
        void this.loadGuide();
      }
    });
  }

  onTabChange(tab: string): void {
    this.activeTab.set(tab as 'men' | 'women' | 'kids');
  }

  retry(): void {
    this._guide.set(null);
    this._error.set(null);
    void this.loadGuide();
  }

  private async loadGuide(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    try {
      const guide = await firstValueFrom(this.catalogApi.sizeGuide(this.categoryId()));
      this._guide.set(guide);
      const tabs = this.availableTabs();
      if (tabs.length > 0 && !tabs.some((tab) => tab.id === this.activeTab())) {
        this.activeTab.set(tabs[0].id as 'men' | 'women' | 'kids');
      }
    } catch {
      this._error.set('Impossible de charger le guide des tailles. Vérifiez votre connexion.');
    } finally {
      this._loading.set(false);
    }
  }
}
