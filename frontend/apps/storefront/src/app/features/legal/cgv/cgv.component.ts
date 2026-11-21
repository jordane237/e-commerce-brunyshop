import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { TocSection } from '@bruny/ui';
import { LEGAL_INFO } from '../../../core/legal';
import { SeoService } from '../../../core/seo.service';
import {
  LegalPageLayoutComponent,
  type BreadcrumbItem,
} from '../../shared/components/legal-page-layout/legal-page-layout.component';

@Component({
  selector: 'bruny-cgv',
  standalone: true,
  imports: [LegalPageLayoutComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cgv.component.html',
  styleUrl: './cgv.component.scss',
})
export class CgvComponent implements OnInit {
  private readonly seo = inject(SeoService);

  readonly legal = LEGAL_INFO;

  readonly breadcrumb: readonly BreadcrumbItem[] = [
    { label: 'Accueil', path: '/' },
    { label: 'Conditions générales de vente' },
  ];

  readonly toc: readonly TocSection[] = [
    { id: 'objet', title: 'Article 1 — Objet', level: 2 },
    { id: 'produits', title: 'Article 2 — Produits', level: 2 },
    { id: 'commande', title: 'Article 3 — Commande', level: 2 },
    { id: 'prix', title: 'Article 4 — Prix', level: 2 },
    { id: 'paiement', title: 'Article 5 — Paiement', level: 2 },
    { id: 'livraison', title: 'Article 6 — Livraison', level: 2 },
    { id: 'retour', title: 'Article 7 — Droit de retour', level: 2 },
    { id: 'remboursement', title: 'Article 8 — Remboursement', level: 2 },
    { id: 'garanties', title: 'Article 9 — Garanties et responsabilité', level: 2 },
    { id: 'donnees', title: 'Article 10 — Données personnelles', level: 2 },
    { id: 'droit', title: 'Article 11 — Droit applicable et litiges', level: 2 },
    { id: 'version', title: 'Article 12 — Version', level: 2 },
  ];

  readonly intro =
    'Les présentes conditions régissent les ventes conclues sur le site BRUNY SHOPPING entre l’éditeur et tout client particulier. Toute commande implique leur acceptation sans réserve.';

  ngOnInit(): void {
    this.seo.setPageMeta({
      title: 'Conditions générales de vente',
      description:
        'Conditions générales de vente BRUNY SHOPPING version 1.0 : commande, prix, paiement à la livraison, retours, remboursements et garanties.',
      canonicalPath: '/cgv',
    });
  }
}
