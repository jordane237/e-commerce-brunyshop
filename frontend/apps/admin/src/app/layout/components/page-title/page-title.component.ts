import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouteMetaService } from '../../navigation/route-meta.service';

@Component({
  selector: 'bruny-page-title',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './page-title.component.html',
  styleUrl: './page-title.component.scss',
})
export class PageTitleComponent {
  private readonly meta = inject(RouteMetaService);
  readonly title = this.meta.title;
}
