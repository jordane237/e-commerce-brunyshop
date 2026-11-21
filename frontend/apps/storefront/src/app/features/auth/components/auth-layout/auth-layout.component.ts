import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '@bruny/ui';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './auth-layout.component.html',
  styleUrl: './auth-layout.component.scss',
})
export class AuthLayoutComponent {
  readonly eyebrow = input('ESPACE CLIENT');
  readonly title = input.required<string>();
  readonly subtitle = input.required<string>();
  readonly asideTitle = input('Vos commandes, vos adresses, vos avantages.');
  readonly asidePoints = input<string[]>([
    'Paiement à la livraison',
    'Échange sous 7 jours',
    'Assistance WhatsApp 7j/7',
  ]);
}
