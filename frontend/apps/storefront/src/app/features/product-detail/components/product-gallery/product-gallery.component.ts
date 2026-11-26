import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { CatalogImage } from '@bruny/data-access';
import { IconComponent, SkeletonComponent } from '@bruny/ui';

@Component({
  selector: 'app-product-gallery',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgOptimizedImage, IconComponent, SkeletonComponent],
  templateUrl: './product-gallery.component.html',
  styleUrl: './product-gallery.component.scss',
})
export class ProductGalleryComponent {
  readonly images = input.required<CatalogImage[]>();
  readonly activeIndex = input.required<number>();
  readonly productName = input('');

  readonly setActiveIndex = output<number>();
  readonly openZoom = output<void>();

  readonly activeImage = computed<CatalogImage | null>(
    () => this.images()[this.activeIndex()] ?? null,
  );

  private touchStartX: number | null = null;

  select(index: number): void {
    if (index < 0 || index >= this.images().length) return;
    this.setActiveIndex.emit(index);
  }

  onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.changedTouches[0]?.clientX ?? null;
  }

  onTouchEnd(event: TouchEvent): void {
    if (this.touchStartX === null) return;
    const endX = event.changedTouches[0]?.clientX ?? this.touchStartX;
    const delta = endX - this.touchStartX;
    this.touchStartX = null;
    if (Math.abs(delta) < 40) return;

    const next = delta < 0 ? this.activeIndex() + 1 : this.activeIndex() - 1;
    this.select(next);
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.select(this.activeIndex() + 1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.select(this.activeIndex() - 1);
    }
  }
}
