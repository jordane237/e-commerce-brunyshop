import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

import { AdminDeliveryZone } from '@bruny/data-access';
import { AdminDeliveryZonesStore } from '../admin-delivery-zones.store';

const MODES = ['HOME', 'RELAY', 'PICKUP'] as const;

@Component({
  selector: 'app-delivery-zones-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <section class="delivery-zones">
      <h1>Zones de livraison</h1>

      <div class="toolbar">
        <button type="button" (click)="store.openCreate()">Nouvelle zone</button>
      </div>

      @if (store.loading()) {
        <p>Chargement…</p>
      } @else if (store.isEmpty()) {
        <p>Aucune zone de livraison.</p>
      } @else if (store.error()) {
        <p role="alert">{{ store.error() }}</p>
        <button type="button" (click)="store.load()">Réessayer</button>
      } @else {
        <table>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Villes</th>
              <th>Frais (XAF)</th>
              <th>Délai (jours)</th>
              <th>Modes</th>
              <th>Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (zone of store.zones(); track zone.id) {
              <tr>
                <td>{{ zone.name }}</td>
                <td>{{ zone.cities.join(', ') }}</td>
                <td>{{ zone.fee }}</td>
                <td>{{ zone.estimatedDays }}</td>
                <td>{{ zone.modes.join(', ') }}</td>
                <td>{{ zone.isActive ? 'Oui' : 'Non' }}</td>
                <td>
                  <button type="button" (click)="openEdit(zone)">Modifier</button>
                  <button type="button" (click)="store.remove(zone)">Supprimer</button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      }

      @if (store.creating()) {
        <div class="modal" role="dialog" aria-modal="true">
          <h2>Nouvelle zone</h2>
          <form [formGroup]="form" (ngSubmit)="submitCreate()">
            <label>Nom <input formControlName="name" /></label>
            <label>Description <textarea formControlName="description"></textarea></label>
            <label>Villes (séparées par des virgules) <input formControlName="cities" /></label>
            <label>Frais <input type="number" formControlName="fee" /></label>
            <label>Délai (jours) <input type="number" formControlName="estimatedDays" /></label>
            <fieldset>
              <legend>Modes</legend>
              @for (mode of modes; track mode) {
                <label
                  ><input
                    type="checkbox"
                    [checked]="isModeChecked(mode)"
                    (change)="toggleMode(mode)"
                  />
                  {{ mode }}</label
                >
              }
            </fieldset>
            <label><input type="checkbox" formControlName="isActive" /> Active</label>
            <button type="submit" [disabled]="form.invalid || selectedModes.length === 0">
              Créer
            </button>
            <button type="button" (click)="store.closeCreate()">Annuler</button>
          </form>
        </div>
      }

      @if (store.editing(); as zone) {
        <div class="modal" role="dialog" aria-modal="true">
          <h2>Modifier la zone</h2>
          <form [formGroup]="editForm" (ngSubmit)="submitEdit(zone.id)">
            <label>Nom <input formControlName="name" /></label>
            <label>Description <textarea formControlName="description"></textarea></label>
            <label>Villes (séparées par des virgules) <input formControlName="cities" /></label>
            <label>Frais <input type="number" formControlName="fee" /></label>
            <label>Délai (jours) <input type="number" formControlName="estimatedDays" /></label>
            <fieldset>
              <legend>Modes</legend>
              @for (mode of modes; track mode) {
                <label
                  ><input
                    type="checkbox"
                    [checked]="isEditModeChecked(mode)"
                    (change)="toggleEditMode(mode)"
                  />
                  {{ mode }}</label
                >
              }
            </fieldset>
            <label><input type="checkbox" formControlName="isActive" /> Active</label>
            <button type="submit" [disabled]="editForm.invalid || selectedEditModes.length === 0">
              Enregistrer
            </button>
            <button type="button" (click)="store.closeEdit()">Annuler</button>
          </form>
        </div>
      }
    </section>
  `,
})
export class DeliveryZonesListComponent {
  readonly store = inject(AdminDeliveryZonesStore);
  private readonly fb = inject(FormBuilder);
  readonly modes = MODES;
  selectedModes: string[] = [];
  selectedEditModes: string[] = [];

  readonly form = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    cities: ['', Validators.required],
    fee: [0, [Validators.required, Validators.min(0)]],
    estimatedDays: [1, [Validators.required, Validators.min(1)]],
    isActive: [true],
  });

  readonly editForm = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    cities: ['', Validators.required],
    fee: [0, [Validators.required, Validators.min(0)]],
    estimatedDays: [1, [Validators.required, Validators.min(1)]],
    isActive: [true],
  });

  constructor() {
    void this.store.load();
  }

  isModeChecked(mode: string): boolean {
    return this.selectedModes.includes(mode);
  }

  toggleMode(mode: string): void {
    if (this.selectedModes.includes(mode)) {
      this.selectedModes = this.selectedModes.filter((m) => m !== mode);
    } else {
      this.selectedModes = [...this.selectedModes, mode];
    }
  }

  isEditModeChecked(mode: string): boolean {
    return this.selectedEditModes.includes(mode);
  }

  toggleEditMode(mode: string): void {
    if (this.selectedEditModes.includes(mode)) {
      this.selectedEditModes = this.selectedEditModes.filter((m) => m !== mode);
    } else {
      this.selectedEditModes = [...this.selectedEditModes, mode];
    }
  }

  private parseCities(value: string): string[] {
    return value
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
  }

  async submitCreate(): Promise<void> {
    if (this.form.invalid || this.selectedModes.length === 0) return;
    const v = this.form.getRawValue();
    await this.store.create({
      name: v.name ?? '',
      description: v.description || null,
      cities: this.parseCities(v.cities ?? ''),
      fee: Number(v.fee ?? 0),
      estimatedDays: Number(v.estimatedDays ?? 1),
      modes: this.selectedModes as never,
      isActive: v.isActive ?? true,
    });
    this.form.reset({
      name: '',
      description: '',
      cities: '',
      fee: 0,
      estimatedDays: 1,
      isActive: true,
    });
    this.selectedModes = [];
  }

  openEdit(zone: AdminDeliveryZone): void {
    this.selectedEditModes = [...zone.modes];
    this.editForm.reset({
      name: zone.name,
      description: zone.description ?? '',
      cities: zone.cities.join(', '),
      fee: zone.fee,
      estimatedDays: zone.estimatedDays,
      isActive: zone.isActive,
    });
    this.store.openEdit(zone);
  }

  async submitEdit(id: string): Promise<void> {
    if (this.editForm.invalid || this.selectedEditModes.length === 0) return;
    const v = this.editForm.getRawValue();
    await this.store.update(id, {
      name: v.name ?? '',
      description: v.description || null,
      cities: this.parseCities(v.cities ?? ''),
      fee: Number(v.fee ?? 0),
      estimatedDays: Number(v.estimatedDays ?? 1),
      modes: this.selectedEditModes as never,
      isActive: v.isActive ?? true,
    });
    this.selectedEditModes = [];
  }
}
