import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import type { TocSection } from '@bruny/ui';
import { SeoService } from '../../../core/seo.service';
import {
  LegalPageLayoutComponent,
  type BreadcrumbItem,
} from '../../shared/components/legal-page-layout/legal-page-layout.component';

interface SizeRow {
  readonly eu: number;
  readonly us: number;
  readonly uk: number;
  readonly cm: number;
}

interface SizeTable {
  readonly id: string;
  readonly title: string;
  readonly rows: readonly SizeRow[];
}

/**
 * Correspondances reprises du seed CAT-06 (`size-guides.seed.ts`).
 * ⚠️ Données à valider par le propriétaire (CNT-02) avant mise en production.
 */
const SIZE_TABLES: readonly SizeTable[] = [
  {
    id: 'hommes',
    title: 'Hommes',
    rows: [
      { eu: 39, us: 6.5, uk: 6, cm: 24.5 },
      { eu: 40, us: 7, uk: 6.5, cm: 25.0 },
      { eu: 41, us: 8, uk: 7.5, cm: 25.7 },
      { eu: 42, us: 8.5, uk: 8, cm: 26.5 },
      { eu: 43, us: 9.5, uk: 9, cm: 27.3 },
      { eu: 44, us: 10, uk: 9.5, cm: 28.0 },
      { eu: 45, us: 11, uk: 10.5, cm: 28.8 },
      { eu: 46, us: 12, uk: 11.5, cm: 29.5 },
      { eu: 47, us: 12.5, uk: 12, cm: 30.2 },
      { eu: 48, us: 13, uk: 12.5, cm: 31.0 },
    ],
  },
  {
    id: 'femmes',
    title: 'Femmes',
    rows: [
      { eu: 35, us: 5, uk: 3, cm: 22.0 },
      { eu: 36, us: 5.5, uk: 3.5, cm: 22.8 },
      { eu: 37, us: 6.5, uk: 4.5, cm: 23.5 },
      { eu: 38, us: 7.5, uk: 5.5, cm: 24.1 },
      { eu: 39, us: 8.5, uk: 6.5, cm: 24.8 },
      { eu: 40, us: 9, uk: 7, cm: 25.5 },
      { eu: 41, us: 10, uk: 8, cm: 26.2 },
      { eu: 42, us: 11, uk: 9, cm: 26.8 },
      { eu: 43, us: 12, uk: 10, cm: 27.5 },
    ],
  },
  {
    id: 'enfants',
    title: 'Enfants',
    rows: [
      { eu: 20, us: 4.5, uk: 3.5, cm: 12.0 },
      { eu: 21, us: 5, uk: 4.5, cm: 12.7 },
      { eu: 22, us: 5.5, uk: 5, cm: 13.3 },
      { eu: 23, us: 6, uk: 5.5, cm: 14.0 },
      { eu: 24, us: 6.5, uk: 6, cm: 14.6 },
      { eu: 25, us: 7, uk: 6.5, cm: 15.2 },
      { eu: 26, us: 7.5, uk: 7, cm: 15.9 },
      { eu: 27, us: 8, uk: 7.5, cm: 16.5 },
      { eu: 28, us: 8.5, uk: 8, cm: 17.1 },
      { eu: 29, us: 9, uk: 8.5, cm: 17.8 },
      { eu: 30, us: 9.5, uk: 9, cm: 18.4 },
      { eu: 31, us: 10, uk: 9.5, cm: 19.1 },
      { eu: 32, us: 10.5, uk: 10, cm: 19.7 },
      { eu: 33, us: 11, uk: 10.5, cm: 20.3 },
      { eu: 34, us: 11.5, uk: 11, cm: 21.0 },
      { eu: 35, us: 12, uk: 11.5, cm: 21.6 },
      { eu: 36, us: 12.5, uk: 12, cm: 22.2 },
      { eu: 37, us: 13, uk: 12.5, cm: 22.9 },
      { eu: 38, us: 13.5, uk: 13, cm: 23.5 },
    ],
  },
];

@Component({
  selector: 'bruny-size-guide',
  standalone: true,
  imports: [LegalPageLayoutComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './size-guide.component.html',
  styleUrl: './size-guide.component.scss',
})
export class SizeGuideComponent implements OnInit {
  private readonly seo = inject(SeoService);

  readonly breadcrumb: readonly BreadcrumbItem[] = [
    { label: 'Accueil', path: '/' },
    { label: 'Guide des tailles' },
  ];

  readonly toc: readonly TocSection[] = [
    { id: 'mesurer', title: 'Mesurer son pied', level: 2 },
    { id: 'hommes', title: 'Hommes', level: 2 },
    { id: 'femmes', title: 'Femmes', level: 2 },
    { id: 'enfants', title: 'Enfants', level: 2 },
    { id: 'conseils', title: 'Nos conseils', level: 2 },
  ];

  readonly tables = SIZE_TABLES;

  readonly intro =
    'Mesurez votre pied du talon au bout de l’orteil le plus long, debout et en fin de journée. Ajoutez 0,5 à 1 cm pour le confort. En cas d’hésitation entre deux pointures, choisissez la plus grande.';

  ngOnInit(): void {
    this.seo.setPageMeta({
      title: 'Guide des tailles',
      description:
        'Correspondances de pointures EU, US, UK et centimètres pour hommes, femmes et enfants, avec les conseils de mesure BRUNY SHOPPING.',
      canonicalPath: '/guide-des-tailles',
    });
  }
}
