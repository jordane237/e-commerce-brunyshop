import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RouteMetaService } from '../../navigation/route-meta.service';

@Component({
  selector: 'bruny-breadcrumb',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './breadcrumb.component.html',
  styleUrl: './breadcrumb.component.scss',
})
export class BreadcrumbComponent {
  private readonly meta = inject(RouteMetaService);
  readonly items = this.meta.breadcrumbs;
}
