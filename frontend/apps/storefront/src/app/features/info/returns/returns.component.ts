import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import type { TocSection } from '@bruny/ui';
import { SeoService } from '../../../core/seo.service';
import {
  LegalPageLayoutComponent,
  type BreadcrumbItem,
} from '../../shared/components/legal-page-layout/legal-page-layout.component';

@Component({
  selector: 'bruny-returns',
  standalone: true,
  imports: [LegalPageLayoutComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './returns.component.html',
  styleUrl: './returns.component.scss',
})
export class ReturnsComponent implements OnInit {
  private readonly seo = inject(SeoService);

  readonly breadcrumb: readonly BreadcrumbItem[] = [
    { label: 'Accueil', path: '/' },
    { label: 'Retours et échanges' },
  ];

  readonly toc: readonly TocSection[] = [
    { id: 'essentiel', title: 'L’essentiel en 4 points', level: 2 },
    { id: 'eligibilite', title: 'Le produit est-il éligible ?', level: 2 },
    { id: 'procedure', title: 'Comment faire ?', level: 2 },
    { id: 'echange', title: 'Échanger une taille', level: 2 },
    { id: 'remboursement', title: 'Remboursement', level: 2 },
  ];

  readonly intro =
    'Un problème de taille ou de produit ? Vous avez 7 jours après réception pour nous demander un retour ou un échange.';

  ngOnInit(): void {
    this.seo.setPageMeta({
      title: 'Retours et échanges',
      description:
        'Conditions, délais et procédure de retour ou d’échange BRUNY SHOPPING : 7 jours après réception, produit non porté, emballage conservé.',
      canonicalPath: '/retours',
    });
  }
}
