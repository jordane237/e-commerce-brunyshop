import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import {
  AdminDeliveryZone,
  AdminDeliveryZonesApi,
  CreateDeliveryZonePayload,
  UpdateDeliveryZonePayload,
} from '@bruny/data-access';
import { ToastService } from '@bruny/core';

@Injectable({ providedIn: 'root' })
export class AdminDeliveryZonesStore {
  private readonly api = inject(AdminDeliveryZonesApi);
  private readonly toast = inject(ToastService);

  private readonly _zones = signal<AdminDeliveryZone[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _editing = signal<AdminDeliveryZone | null>(null);
  private readonly _creating = signal(false);

  readonly zones = this._zones.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly editing = this._editing.asReadonly();
  readonly creating = this._creating.asReadonly();
  readonly isEmpty = computed(
    () => !this._loading() && this._zones().length === 0 && !this._error(),
  );

  async load(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    try {
      const zones = await firstValueFrom(this.api.list());
      this._zones.set(zones);
    } catch {
      this._error.set('Impossible de charger les zones de livraison.');
      this._zones.set([]);
    } finally {
      this._loading.set(false);
    }
  }

  openCreate(): void {
    this._creating.set(true);
  }

  closeCreate(): void {
    this._creating.set(false);
  }

  openEdit(zone: AdminDeliveryZone): void {
    this._editing.set(zone);
  }

  closeEdit(): void {
    this._editing.set(null);
  }

  async create(payload: CreateDeliveryZonePayload): Promise<void> {
    try {
      await firstValueFrom(this.api.create(payload));
      this.toast.success('Zone de livraison créée.');
      this._creating.set(false);
      await this.load();
    } catch {
      this.toast.error('Une erreur est survenue. Réessayez.');
    }
  }

  async update(id: string, payload: UpdateDeliveryZonePayload): Promise<void> {
    try {
      await firstValueFrom(this.api.update(id, payload));
      this.toast.success('Zone de livraison mise à jour.');
      this._editing.set(null);
      await this.load();
    } catch {
      this.toast.error('Une erreur est survenue. Réessayez.');
    }
  }

  async remove(zone: AdminDeliveryZone): Promise<void> {
    try {
      await firstValueFrom(this.api.remove(zone.id));
      this.toast.success('Zone de livraison supprimée.');
      await this.load();
    } catch {
      this.toast.error('Impossible de supprimer cette zone (peut-être utilisée).');
    }
  }
}
