import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'bruny-hero-banner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgOptimizedImage, RouterLink],
  templateUrl: './hero-banner.component.html',
  styleUrl: './hero-banner.component.scss',
})
export class HeroBannerComponent {
  /** Numéro WhatsApp public, aligné sur l'en-tête du storefront. */
  readonly whatsappUrl = 'https://wa.me/237600000000';
}
