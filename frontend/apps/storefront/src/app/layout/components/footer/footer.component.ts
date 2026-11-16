import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { APP_CONFIG } from '../../../core/app-config';

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
  readonly supportEmail = this.config.supportEmail;
  readonly year = new Date().getFullYear();
}
