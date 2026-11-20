import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs';
import { ConsentService } from '../../../core/services/consent.service';
import {
  isTunnelUrl,
  resolveWhatsAppContext,
  WhatsAppService,
} from '../../../core/services/whatsapp.service';

@Component({
  selector: 'app-whatsapp-fab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './whatsapp-fab.component.html',
  styleUrl: './whatsapp-fab.component.scss',
})
export class WhatsAppFabComponent {
  private readonly router = inject(Router);
  private readonly consent = inject(ConsentService);
  private readonly whatsapp = inject(WhatsAppService);

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  readonly context = computed(() => resolveWhatsAppContext(this.currentUrl()));
  readonly link = computed(() => this.whatsapp.buildLink(this.context()));
  readonly isTunnel = computed(() => isTunnelUrl(this.currentUrl()));
  readonly isContact = computed(() => this.context().page === 'contact');
  readonly isProduct = computed(() => this.context().page === 'product');
  readonly visible = computed(
    () =>
      !this.isTunnel() && !this.isContact() && !this.consent.showBanner() && this.link() !== null,
  );
}
