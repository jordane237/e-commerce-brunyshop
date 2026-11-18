import { afterNextRender, ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { ToastService } from '@bruny/core';
import { ToastComponent } from '@bruny/ui';
import { ConsentBannerComponent } from './layout/components/consent-banner/consent-banner.component';
import { FooterComponent } from './layout/components/footer/footer.component';
import { MiniCartComponent } from './layout/components/mini-cart/mini-cart.component';
import { ConsentService } from './core/services/consent.service';
import { MetaPixelService } from './core/services/meta-pixel.service';
import { UtmService } from './core/services/utm.service';

@Component({
  imports: [
    RouterLink,
    RouterOutlet,
    ToastComponent,
    MiniCartComponent,
    FooterComponent,
    ConsentBannerComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  readonly toast = inject(ToastService);
  private readonly consent = inject(ConsentService);
  private readonly utm = inject(UtmService);
  private readonly metaPixel = inject(MetaPixelService);

  constructor() {
    // Après hydratation uniquement : le serveur ne rend ni bandeau ni traceur.
    afterNextRender(() => {
      this.consent.initialize();
      this.utm.captureFromUrl();
      this.metaPixel.start();
    });
  }
}
