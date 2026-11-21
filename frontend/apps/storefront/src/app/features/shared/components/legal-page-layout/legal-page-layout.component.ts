import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TableOfContentsComponent, type TocSection } from '@bruny/ui';

export interface BreadcrumbItem {
  readonly label: string;
  readonly path?: string;
}

@Component({
  selector: 'bruny-legal-page-layout',
  standalone: true,
  imports: [RouterLink, TableOfContentsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './legal-page-layout.component.html',
  styleUrl: './legal-page-layout.component.scss',
})
export class LegalPageLayoutComponent {
  readonly title = input.required<string>();
  readonly eyebrow = input<string | null>(null);
  readonly intro = input<string | null>(null);
  readonly lastUpdated = input<string | null>(null);
  readonly lastUpdatedIso = input<string | null>(null);
  readonly version = input<string | null>(null);
  readonly toc = input<readonly TocSection[]>([]);
  readonly breadcrumb = input<readonly BreadcrumbItem[]>([]);
  readonly supportEmail = input('support@brunyshop.cm');
}
