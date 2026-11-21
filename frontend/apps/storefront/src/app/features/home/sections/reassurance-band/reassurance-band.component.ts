import { ChangeDetectionStrategy, Component } from '@angular/core';

interface ReassuranceItem {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly icon: 'payment' | 'delivery' | 'exchange' | 'support';
}

@Component({
  selector: 'bruny-reassurance-band',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './reassurance-band.component.html',
  styleUrl: './reassurance-band.component.scss',
})
export class ReassuranceBandComponent {
  readonly items: readonly ReassuranceItem[] = [
    {
      id: 'payment',
      title: 'Paiement à la livraison',
      description: 'Payez une fois la paire reçue.',
      icon: 'payment',
    },
    {
      id: 'delivery',
      title: 'Livraison à Douala et Yaoundé',
      description: 'Vos commandes livrées dans les villes desservies.',
      icon: 'delivery',
    },
    {
      id: 'exchange',
      title: 'Échange sous 7 jours',
      description: 'Pas la bonne pointure ? L’échange est possible.',
      icon: 'exchange',
    },
    {
      id: 'support',
      title: 'Support WhatsApp',
      description: 'Une question ? Notre équipe vous répond.',
      icon: 'support',
    },
  ];
}
