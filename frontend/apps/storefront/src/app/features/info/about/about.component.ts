import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { TocSection } from '@bruny/ui';
import { APP_CONFIG } from '../../../core/app-config';
import { SeoService } from '../../../core/seo.service';
import { aboutPageSchema } from '../../../core/structured-data';
import {
  LegalPageLayoutComponent,
  type BreadcrumbItem,
} from '../../shared/components/legal-page-layout/legal-page-layout.component';

@Component({
  selector: 'bruny-about',
  standalone: true,
  imports: [LegalPageLayoutComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss',
})
export class AboutComponent implements OnInit {
  private readonly seo = inject(SeoService);
  private readonly config = inject(APP_CONFIG);

  readonly breadcrumb: readonly BreadcrumbItem[] = [
    { label: 'Accueil', path: '/' },
    { label: 'À propos' },
  ];

  readonly toc: readonly TocSection[] = [
    { id: 'histoire', title: 'Notre histoire', level: 2 },
    { id: 'selection', title: 'Ce que nous choisissons', level: 2 },
    { id: 'travail', title: 'Comment nous travaillons', level: 2 },
    { id: 'engagements', title: 'Nos engagements', level: 2 },
  ];

  readonly intro =
    'BRUNY SHOPPING sélectionne des chaussures pour le quotidien, à Douala et partout au Cameroun, avec un service simple : de vraies tailles, des prix clairs et un humain au bout du fil.';

  ngOnInit(): void {
    const description =
      'Découvrez BRUNY SHOPPING, votre boutique de chaussures au Cameroun : notre histoire, notre sélection, nos engagements et notre service.';
    this.seo.setPageMeta({
      title: 'À propos',
      description,
      canonicalPath: '/a-propos',
      jsonLd: aboutPageSchema(this.config, description),
    });
  }
}
