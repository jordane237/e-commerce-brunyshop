import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { TocSection } from '@bruny/ui';
import { LEGAL_INFO, LEGAL_PLACEHOLDER } from '../../../core/legal';
import { SeoService } from '../../../core/seo.service';
import {
  LegalPageLayoutComponent,
  type BreadcrumbItem,
} from '../../shared/components/legal-page-layout/legal-page-layout.component';

@Component({
  selector: 'bruny-legal-notice',
  standalone: true,
  imports: [LegalPageLayoutComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './legal-notice.component.html',
  styleUrl: './legal-notice.component.scss',
})
export class LegalNoticeComponent implements OnInit {
  private readonly seo = inject(SeoService);

  readonly legal = LEGAL_INFO;
  readonly placeholder = LEGAL_PLACEHOLDER;

  readonly breadcrumb: readonly BreadcrumbItem[] = [
    { label: 'Accueil', path: '/' },
    { label: 'Mentions légales' },
  ];

  readonly toc: readonly TocSection[] = [
    { id: 'editeur', title: 'Éditeur du site', level: 2 },
    { id: 'hebergement', title: 'Hébergement', level: 2 },
    { id: 'propriete', title: 'Propriété intellectuelle', level: 2 },
    { id: 'donnees', title: 'Données personnelles', level: 2 },
    { id: 'cookies', title: 'Cookies et traceurs', level: 2 },
    { id: 'reclamation', title: 'Réclamation', level: 2 },
  ];

  readonly intro =
    'Informations relatives à l’éditeur du site, à son hébergement et aux conditions d’utilisation des contenus.';

  ngOnInit(): void {
    this.seo.setPageMeta({
      title: 'Mentions légales',
      description:
        'Mentions légales BRUNY SHOPPING : éditeur du site, hébergement, propriété intellectuelle, données personnelles, cookies et réclamation.',
      canonicalPath: '/mentions-legales',
    });
  }
}
