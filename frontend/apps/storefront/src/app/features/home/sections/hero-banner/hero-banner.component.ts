import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { APP_CONFIG } from '../../../../core/app-config';

@Component({
  selector: 'bruny-hero-banner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgOptimizedImage, RouterLink],
  templateUrl: './hero-banner.component.html',
  styleUrl: './hero-banner.component.scss',
})
export class HeroBannerComponent {
  private readonly config = inject(APP_CONFIG);

  /** URL WhatsApp publique, source de vérité unique de la boutique. */
  readonly whatsappUrl = this.config.contactWhatsappUrl;
}
