import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { APP_CONFIG } from '../../../core/app-config';
import { ConsentService } from '../../../core/services/consent.service';

@Component({
  selector: 'bruny-footer',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent {
  private readonly config = inject(APP_CONFIG);
  private readonly consent = inject(ConsentService);
  readonly supportEmail = this.config.supportEmail;
  readonly year = new Date().getFullYear();

  openConsentPreferences(): void {
    this.consent.openBanner();
  }
}
