import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { AccordionComponent, type AccordionItem, type TocSection } from '@bruny/ui';
import { SeoService } from '../../../core/seo.service';
import {
  LegalPageLayoutComponent,
  type BreadcrumbItem,
} from '../../shared/components/legal-page-layout/legal-page-layout.component';

interface DeliveryZone {
  readonly name: string;
  readonly delay: string;
  readonly fee: string;
}

@Component({
  selector: 'bruny-delivery',
  standalone: true,
  imports: [LegalPageLayoutComponent, AccordionComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './delivery.component.html',
  styleUrl: './delivery.component.scss',
})
export class DeliveryComponent implements OnInit {
  private readonly seo = inject(SeoService);

  readonly breadcrumb: readonly BreadcrumbItem[] = [
    { label: 'Accueil', path: '/' },
    { label: 'Livraison' },
  ];

  readonly toc: readonly TocSection[] = [
    { id: 'zones', title: 'Zones, délais et frais', level: 2 },
    { id: 'deroulement', title: 'Comment se passe la livraison', level: 2 },
    { id: 'paiement', title: 'Paiement à la livraison', level: 2 },
    { id: 'suivi', title: 'Suivre ma commande', level: 2 },
    { id: 'hors-zone', title: 'Ma ville n’est pas listée', level: 2 },
    { id: 'faq-livraison', title: 'Questions sur la livraison', level: 2 },
  ];

  readonly intro =
    'Nous livrons à Douala, Yaoundé, Bafoussam et dans plusieurs régions du Cameroun.';

  readonly zones: readonly DeliveryZone[] = [
    { name: 'Douala Centre', delay: '1 jour ouvré', fee: '1 500 FCFA' },
    { name: 'Douala Périphérie', delay: '2 jours ouvrés', fee: '2 500 FCFA' },
    { name: 'Yaoundé', delay: '3 jours ouvrés', fee: '3 000 FCFA' },
    { name: 'Bafoussam', delay: '4 jours ouvrés', fee: '4 000 FCFA' },
    { name: 'Autres régions', delay: '5 jours ouvrés', fee: '5 000 FCFA' },
  ];

  readonly faq: readonly AccordionItem[] = [
    {
      id: 'delai-douala',
      question: 'Quels sont les délais de livraison à Douala ?',
      answer:
        'Comptez 1 jour ouvré à Douala Centre et 2 jours ouvrés à Douala Périphérie, à partir de la confirmation de votre commande.',
    },
    {
      id: 'paiement-avant',
      question: 'Dois-je payer avant la livraison ?',
      answer:
        'Non. Vous réglez en espèces ou par Mobile Money au moment de la réception, après avoir vérifié votre colis.',
    },
    {
      id: 'zone-absente',
      question: 'Ma ville n’apparaît pas dans le tableau. Que faire ?',
      answer:
        'Écrivez-nous : nous étudions les demandes de nouvelles zones et vous proposons une solution si une livraison est possible.',
    },
  ];

  ngOnInit(): void {
    this.seo.setPageMeta({
      title: 'Livraison',
      description:
        'Zones, délais et frais de livraison BRUNY SHOPPING à Douala, Yaoundé, Bafoussam et dans les autres régions du Cameroun.',
      canonicalPath: '/livraison',
    });
  }
}
