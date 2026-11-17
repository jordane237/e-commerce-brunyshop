import { ChangeDetectionStrategy, Component, TemplateRef, input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { SkeletonComponent } from '../skeleton/skeleton.component';

@Component({
  selector: 'bruny-card-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, SkeletonComponent],
  templateUrl: './card-list.component.html',
  styleUrl: './card-list.component.scss',
})
export class CardListComponent<T extends Record<string, unknown>> {
  readonly items = input.required<T[]>();
  readonly rowKey = input.required<keyof T>();
  readonly loading = input<boolean>(false);
  readonly cardTemplate = input.required<TemplateRef<{ $implicit: T }>>();
  readonly emptyTemplate = input<TemplateRef<void> | null>(null);
}
