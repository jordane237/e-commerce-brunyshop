import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { APP_CONFIG } from '../../../../core/app-config';
import { ShareService, SharePayload } from '../../../../core/services/share.service';
import { ToastService } from '@bruny/core';
import { IconComponent } from '@bruny/ui';

@Component({
  selector: 'app-share-buttons',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  templateUrl: './share-buttons.component.html',
  styleUrl: './share-buttons.component.scss',
})
export class ShareButtonsComponent {
  private readonly shareService = inject(ShareService);
  private readonly toast = inject(ToastService);
  private readonly config = inject(APP_CONFIG);

  readonly productSlug = input.required<string>();
  readonly productName = input.required<string>();
  readonly productDescription = input<string | null>(null);
  readonly productImageUrl = input<string | null>(null);
  readonly productPrice = input.required<number>();

  private buildPayload(): SharePayload {
    const siteUrl = this.config.siteUrl ?? 'https://brunyshop.cm';
    return {
      url: `${siteUrl}/produit/${this.productSlug()}`,
      title: this.productName(),
      description: this.productDescription() ?? undefined,
      imageUrl: this.productImageUrl() ?? undefined,
    };
  }

  onFacebook(): void {
    this.shareService.shareOnFacebook(this.buildPayload());
  }

  onWhatsApp(): void {
    this.shareService.shareOnWhatsApp(this.buildPayload());
  }

  onCopyLink(): void {
    this.shareService.copyLink(this.buildPayload().url).subscribe((success) => {
      if (success) this.toast.success('Lien copié !');
      else this.toast.error('Impossible de copier le lien. Réessayez.');
    });
  }
}
