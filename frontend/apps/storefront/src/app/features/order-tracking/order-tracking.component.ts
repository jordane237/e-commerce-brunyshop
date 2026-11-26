import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map, startWith } from 'rxjs';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';

import { EmptyStateComponent } from '@bruny/ui';
import { StatusBadgeComponent } from '@bruny/ui';
import { SkeletonComponent } from '@bruny/ui';
import { TimelineComponent, type TimelineEntry } from '@bruny/ui';
import { ButtonComponent } from '@bruny/ui';
import { InputComponent } from '@bruny/ui';
import { IconComponent } from '@bruny/ui';
import { FcfaPipe } from '@bruny/util';

import { SeoService } from '../../core/seo.service';
import { WhatsAppService } from '../../core/services/whatsapp.service';
import { OrderTrackingStore } from './order-tracking.store';

@Component({
  selector: 'app-order-tracking',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    DatePipe,
    InputComponent,
    ButtonComponent,
    TimelineComponent,
    StatusBadgeComponent,
    EmptyStateComponent,
    SkeletonComponent,
    IconComponent,
    FcfaPipe,
  ],
  templateUrl: './order-tracking.component.html',
  styleUrl: './order-tracking.component.scss',
})
export class OrderTrackingComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly store = inject(OrderTrackingStore);
  private readonly seoService = inject(SeoService);
  private readonly whatsAppService = inject(WhatsAppService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = this.store.loading;
  readonly error = this.store.error;
  readonly result = this.store.result;
  readonly found = this.store.found;
  readonly order = this.store.order;
  readonly isEmpty = this.store.isEmpty;

  readonly form = this.buildForm();

  readonly referenceError = toSignal(
    this.form.controls.reference.events.pipe(
      startWith(null),
      map(() => this.getFieldError('reference')),
    ),
    { initialValue: null },
  );
  readonly phoneError = toSignal(
    this.form.controls.phone.events.pipe(
      startWith(null),
      map(() => this.getFieldError('phone')),
    ),
    { initialValue: null },
  );

  readonly whatsappHelpUrl = computed(() => {
    const order = this.order();
    if (!order) return '';
    const link = this.whatsAppService.buildLink({
      page: 'confirmation',
      orderReference: order.reference,
    });
    return link ?? '';
  });

  readonly canRequestExchange = computed(() => this.order()?.status === 'DELIVERED');

  readonly timelineEntries = computed<TimelineEntry[]>(() => {
    const order = this.order();
    if (!order) return [];
    return order.timeline.map((entry) => ({
      status: entry.status,
      label: entry.label,
      date: (entry.date as string | null) ?? null,
      isCurrent: entry.isCurrent,
      isCompleted: entry.isCompleted,
    }));
  });

  constructor() {
    this.seoService.setPageMeta({
      title: 'Suivre ma commande',
      description:
        "Suivez l'état de votre commande BrunyShop avec votre numéro de commande et votre téléphone.",
      noIndex: true,
    });

    // Réagir aux query params (pré-remplissage + soumission auto).
    this.route.queryParamMap
      .pipe(
        map((p) => ({
          reference: p.get('reference') ?? '',
          phone: p.get('phone') ?? '',
        })),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(({ reference, phone }) => {
        if (reference) this.form.controls.reference.setValue(reference);
        if (phone) this.form.controls.phone.setValue(phone);
        if (reference && phone && this.form.valid) {
          void this.store.track(reference, phone);
        }
      });
  }

  private buildForm() {
    return this.fb.group({
      reference: this.fb.control('', [
        Validators.required,
        Validators.pattern(/^BRN-[0-9]{4}-[A-Z0-9]{4}$/),
      ]),
      phone: this.fb.control('', [Validators.required, Validators.pattern(/^\+237[0-9]{9}$/)]),
    });
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { reference, phone } = this.form.getRawValue();
    await this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { reference, phone },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
    await this.store.track(reference, phone);
  }

  onReset(): void {
    this.store.reset();
    this.form.reset();
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
      replaceUrl: true,
    });
  }

  getStatusVariant(status: string): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
    switch (status) {
      case 'DELIVERED':
        return 'success';
      case 'CANCELLED':
      case 'DELIVERY_FAILED':
        return 'danger';
      case 'PENDING_CONFIRMATION':
        return 'warning';
      default:
        return 'info';
    }
  }

  private getFieldError(field: 'reference' | 'phone'): string | null {
    const ctrl = this.form.controls[field];
    if (!ctrl.touched || !ctrl.invalid) return null;
    if (ctrl.hasError('required')) {
      return field === 'reference'
        ? 'Le numéro de commande est requis.'
        : 'Le téléphone est requis.';
    }
    if (ctrl.hasError('pattern')) {
      return field === 'reference'
        ? 'Le numéro de commande doit être au format BRN-XXXX-XXXX.'
        : 'Le téléphone doit être au format +237XXXXXXXXX.';
    }
    return null;
  }
}
