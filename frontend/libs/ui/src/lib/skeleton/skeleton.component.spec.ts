import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { SkeletonComponent, type SkeletonVariant } from './skeleton.component';

@Component({
  standalone: true,
  imports: [SkeletonComponent],
  template: `
    <bruny-skeleton
      class="skeleton-1"
      [variant]="variant()"
      [width]="width()"
      [height]="height()"
      [lines]="lines()"
    />
  `,
})
class SkeletonHostComponent {
  readonly variant = signal<SkeletonVariant>('rect');
  readonly width = signal('100%');
  readonly height = signal('1rem');
  readonly lines = signal(1);
}

function setHostValue(instance: object, key: string, value: unknown): void {
  const record = instance as Record<string, unknown>;
  const current = record[key];
  if (typeof current === 'function' && 'set' in current) {
    (current as { set: (next: unknown) => void }).set(value);
    return;
  }
  record[key] = value;
}

describe('SkeletonComponent', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  async function create(overrides: Partial<Record<keyof SkeletonHostComponent, unknown>> = {}) {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [SkeletonHostComponent] });
    const fixture = TestBed.createComponent(SkeletonHostComponent);
    fixture.detectChanges();
    for (const [key, value] of Object.entries(overrides)) {
      setHostValue(fixture.componentInstance, key, value);
    }
    fixture.detectChanges();
    return {
      fixture,
      nativeElement: fixture.nativeElement as HTMLElement,
      componentInstance: fixture.componentInstance,
    };
  }

  it('renders a rectangular skeleton by default', async () => {
    const { nativeElement } = await create();
    const skeleton = nativeElement.querySelector('.bs-skeleton') as HTMLElement;

    expect(skeleton).not.toBeNull();
    expect(skeleton.getAttribute('aria-hidden')).toBe('true');
  });

  it('applies the circle variant', async () => {
    const { nativeElement } = await create({ variant: 'circle' });
    expect(nativeElement.querySelector('.bs-skeleton')?.classList).toContain('bs-skeleton--circle');
  });

  it('applies the text variant', async () => {
    const { nativeElement } = await create({ variant: 'text' });
    const skeleton = nativeElement.querySelector('.bs-skeleton') as HTMLElement;

    expect(skeleton.classList).toContain('bs-skeleton--text');
  });

  it('renders multiple bars for multiline text', async () => {
    const { nativeElement } = await create({ variant: 'text', lines: 3 });
    const bars = nativeElement.querySelectorAll('.bs-skeleton__bar');

    expect(bars.length).toBe(3);
    expect((bars[2] as HTMLElement).style.width).toBe('70%');
  });

  it('applies custom dimensions', async () => {
    const { nativeElement } = await create({ width: '120px', height: '20px' });
    const skeleton = nativeElement.querySelector('.bs-skeleton') as HTMLElement;

    expect(skeleton.style.width).toBe('120px');
    expect(skeleton.style.height).toBe('20px');
  });
});
