import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

export type SkeletonVariant = 'rect' | 'text' | 'circle';

@Component({
  selector: 'bruny-skeleton',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './skeleton.component.html',
  styleUrl: './skeleton.component.scss',
})
export class SkeletonComponent {
  @Input() variant: SkeletonVariant = 'rect';
  @Input() width = '100%';
  @Input() height = '1rem';
  @Input() radius: 'sm' | 'md' | 'lg' | 'full' = 'md';
  @Input() lines = 1;

  get lineIndexes(): number[] {
    return Array.from({ length: Math.max(1, this.lines) }, (_, index) => index);
  }
}
