import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'bruny-facebook-cta',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './facebook-cta.component.html',
  styleUrl: './facebook-cta.component.scss',
})
export class FacebookCtaComponent {
  /**
   * URL de la page Facebook. Configurable par le parent tant que la config
   * publique (`/api/v1/config`) n'expose pas ce lien.
   */
  readonly url = input('https://www.facebook.com/BrunyShopping');
  readonly label = input('Suivez-nous sur Facebook');
}
