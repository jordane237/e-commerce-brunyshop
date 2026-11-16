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
  selector: 'bruny-privacy',
  standalone: true,
  imports: [LegalPageLayoutComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './privacy.component.html',
  styleUrl: './privacy.component.scss',
})
export class PrivacyComponent implements OnInit {
  private readonly seo = inject(SeoService);

  readonly legal = LEGAL_INFO;

  readonly breadcrumb: readonly BreadcrumbItem[] = [
    { label: 'Accueil', path: '/' },
    { label: 'Politique de confidentialité' },
  ];

  readonly toc: readonly TocSection[] = [
    { id: 'responsable', title: 'Responsable du traitement', level: 2 },
    { id: 'donnees', title: 'Données collectées', level: 2 },
    { id: 'finalites', title: 'Finalités et bases légales', level: 2 },
    { id: 'durees', title: 'Durées de conservation', level: 2 },
    { id: 'destinataires', title: 'Destinataires', level: 2 },
    { id: 'transferts', title: 'Transferts hors Cameroun', level: 2 },
    { id: 'securite', title: 'Sécurité', level: 2 },
    { id: 'turnstile', title: 'Protection contre les robots', level: 2 },
    { id: 'droits', title: 'Vos droits', level: 2 },
    { id: 'cookies', title: 'Cookies', level: 2 },
    { id: 'contact', title: 'Contact', level: 2 },
  ];

  readonly intro =
    'Cette politique décrit les données personnelles collectées par BRUNY SHOPPING, pourquoi elles le sont, combien de temps elles sont conservées et comment exercer vos droits.';

  ngOnInit(): void {
    this.seo.setPageMeta({
      title: 'Politique de confidentialité',
      description:
        'Politique de confidentialité BRUNY SHOPPING : données collectées, finalités, durées de conservation, destinataires, sécurité et exercice de vos droits.',
      canonicalPath: '/politique-confidentialite',
    });
  }
}
