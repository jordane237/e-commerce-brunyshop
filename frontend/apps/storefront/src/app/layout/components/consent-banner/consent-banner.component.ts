import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonComponent, CheckboxComponent, ModalComponent } from '@bruny/ui';
import { ConsentService } from '../../../core/services/consent.service';

@Component({
  selector: 'app-consent-banner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ButtonComponent, CheckboxComponent, ModalComponent],
  templateUrl: './consent-banner.component.html',
  styleUrl: './consent-banner.component.scss',
})
export class ConsentBannerComponent {
  readonly consent = inject(ConsentService);

  readonly customizeOpen = signal(false);
  readonly analyticsEnabled = signal(false);
  readonly marketingEnabled = signal(false);

  onAccept(): void {
    this.consent.acceptAll();
  }

  onReject(): void {
    this.consent.rejectAll();
  }

  onCustomize(): void {
    const preferences = this.consent.preferences();
    this.analyticsEnabled.set(preferences?.analytics ?? false);
    this.marketingEnabled.set(preferences?.marketing ?? false);
    this.customizeOpen.set(true);
  }

  onSaveCustom(): void {
    this.consent.customize({
      analytics: this.analyticsEnabled(),
      marketing: this.marketingEnabled(),
    });
    this.customizeOpen.set(false);
  }

  onCancelCustom(): void {
    this.customizeOpen.set(false);
  }
}
