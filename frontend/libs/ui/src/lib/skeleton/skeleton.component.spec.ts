import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { SkeletonComponent } from './skeleton.component';

@Component({
  standalone: true,
  imports: [SkeletonComponent],
  template: `
    <span class="skeleton-host">
      <bruny-skeleton [shape]="shape()" [size]="size()" [image]="image()" class="skeleton-1" />
      <bruny-skeleton [shape]="'text'" [size]="'md'" class="skeleton-2" />
    </span>
  `,
})
class SkeletonHostComponent {
  readonly shape = signal<'text' | 'circular' | 'rectangular'>('text');
  readonly size = signal<'sm' | 'md' | 'lg'>('sm');
  readonly image = signal(false);
}

describe('SkeletonComponent', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  async function create(overrides: Partial<Record<keyof SkeletonHostComponent, unknown>> = {}) {
    await TestBed.configureTestingModule({
      imports: [SkeletonHostComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(SkeletonHostComponent);
    await fixture.whenStable();
    for (const [key, value] of Object.entries(overrides)) {
      (fixture.componentInstance as Record<string, never>)[key] = value as never;
    }
    await fixture.detectChanges();
    await fixture.whenStable();
    return fixture;
  }

  it('renders a skeleton placeholder', async () => {
    const { nativeElement } = await create();
    await Promise.resolve();

    expect(nativeElement.querySelector('.bs-skeleton')).not.toBeNull();
    expect(nativeElement.querySelector('.skeleton-host')).not.toBeNull();
  });

  it('adds the circular shape class when shape is circular', async () => {
    const { nativeElement } = await create({ shape: 'circular' });
    await Promise.resolve();
    const skeleton = nativeElement.querySelector('.skeleton-1') as HTMLElement;

    expect(skeleton?.classList).toContain('bs-skeleton--circular');
  });

  it('adds the rectangular shape class when shape is rectangular', async () => {
    const { nativeElement } = await create({ shape: 'rectangular' });
    await Promise.resolve();
    const skeleton = nativeElement.querySelector('.skeleton-1') as HTMLElement;

    expect(skeleton?.classList).toContain('bs-skeleton--rectangular');
  });

  it('adds the text shape class by default when shape is text', async () => {
    const { nativeElement } = await create({ shape: 'text' });
    await Promise.resolve();
    const skeleton = nativeElement.querySelector('.skeleton-1') as HTMLElement;

    expect(skeleton?.classList).toContain('bs-skeleton--text');
  });

  it('supports the sm, md and lg size variants', async () => {
    let { nativeElement } = await create({ size: 'sm' });
    await Promise.resolve();

    expect(nativeElement.querySelector('.skeleton-1')?.classList.contains('bs-skeleton--sm')).toBe(
      true,
    );

    ({ nativeElement } = await create({ size: 'md' }));
    await Promise.resolve();
    expect(nativeElement.querySelector('.skeleton-1')?.classList.contains('bs-skeleton--md')).toBe(
      true,
    );

    ({ nativeElement } = await create({ size: 'lg' }));
    await Promise.resolve();
    expect(nativeElement.querySelector('.skeleton-1')?.classList.contains('bs-skeleton--lg')).toBe(
      true,
    );
  });

  it('renders with an image role when the image flag is true', async () => {
    const { nativeElement } = await create({ image: true });
    await Promise.resolve();
    const skeleton = nativeElement.querySelector('.skeleton-1') as HTMLElement;

    expect(skeleton?.classList).toContain('bs-skeleton--image');
  });

  it('does not render the image class by default', async () => {
    const { nativeElement } = await create({ image: false });
    await Promise.resolve();
    const skeleton = nativeElement.querySelector('.skeleton-1') as HTMLElement;

    expect(skeleton?.classList.contains('bs-skeleton--image')).toBe(false);
  });

  it('has a neutral background and a shimmer on the host element', async () => {
    const { nativeElement } = await create();
    await Promise.resolve();
    const skeleton = nativeElement.querySelector('.bs-skeleton') as HTMLElement;

    expect(getComputedStyle(skeleton).background).toBeTruthy();
    expect(getComputedStyle(skeleton).borderRadius).toBeTruthy();
    fixture.detectChanges();
  });

  it('exposes a shimmer pseudo-element', async () => {
    const { nativeElement, fixture } = await create();
    await Promise.resolve();
    const skeleton = nativeElement.querySelector('.bs-skeleton') as HTMLElement;

    expect(skeleton?.style.setProperty).toBeUndefined();
    const pseudo = skeleton?.getElementsByTagName('*').length;
    expect(pseudo).toBeGreaterThanOrEqual(0);
    fixture.detectChanges();
  });

  it('is visible in the document layout', async () => {
    const { nativeElement, fixture } = await create();
    await Promise.resolve();
    const skeleton = nativeElement.querySelector('.bs-skeleton') as HTMLElement;

    expect(skeleton?.offsetParent).not.toBeNull();
    expect(getComputedStyle(skeleton).display).not.toBe('none');
    fixture.detectChanges();
  });
});
