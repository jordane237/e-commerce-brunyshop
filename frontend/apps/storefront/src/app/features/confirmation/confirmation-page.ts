import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { EmptyStateComponent } from '@bruny/ui';
import { FcfaPipe } from '@bruny/util';

import { SeoService } from '../../core/seo.service';
import { WhatsAppService } from '../../core/services/whatsapp.service';
import { CheckoutStore } from '../checkout/checkout.store';
import { toOrderPhone } from '../checkout/checkout.model';

@Component({
  selector: 'app-confirmation-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe, EmptyStateComponent, FcfaPipe],
  templateUrl: './confirmation-page.html',
  styleUrl: './confirmation-page.scss',
})
export class ConfirmationPage {
  private readonly router = inject(Router);
  private readonly seo = inject(SeoService);
  private readonly whatsapp = inject(WhatsAppService);
  readonly checkout = inject(CheckoutStore);

  readonly copied = signal(false);
  readonly copyError = signal(false);

  readonly order = this.checkout.order;
  readonly items = this.checkout.submittedItems;

  readonly trackingPhone = computed(() => {
    const phone = this.checkout.contact().phone;
    if (!phone) return '';
    try {
      return toOrderPhone(phone);
    } catch {
      return '';
    }
  });

  readonly whatsappLink = computed(() => {
    const order = this.order();
    if (order === null) return null;
    return this.whatsapp.buildLink({
      page: 'confirmation',
      orderReference: order.reference,
    });
  });

  readonly whatsappConfigured = this.whatsapp.configured;

  constructor() {
    this.seo.setPageMeta({
      title: 'Commande confirmée',
      description: 'Votre commande BrunyShop a été enregistrée.',
      canonicalPath: '/confirmation',
      noIndex: true,
    });
  }

  async copyReference(): Promise<void> {
    const reference = this.order()?.reference;
    if (reference === undefined) return;

    this.copied.set(false);
    this.copyError.set(false);

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText !== undefined) {
        await navigator.clipboard.writeText(reference);
        this.copied.set(true);
        return;
      }
    } catch {
      // Fallback ci-dessous.
    }

    try {
      if (typeof document !== 'undefined') {
        const textarea = document.createElement('textarea');
        textarea.value = reference;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textarea);
        if (success) {
          this.copied.set(true);
          return;
        }
      }
    } catch {
      // Échec silencieux géré par copyError.
    }

    this.copyError.set(true);
  }

  goToCatalog(): void {
    void this.router.navigate(['/boutique']);
  }
}
