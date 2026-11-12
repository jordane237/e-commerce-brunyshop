import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { HeroBannerComponent } from './hero-banner.component';

describe('HeroBannerComponent', () => {
  it('renders the validated hero copy and priorities the image', async () => {
    const fixture = TestBed.configureTestingModule({
      imports: [HeroBannerComponent],
      providers: [provideRouter([])],
    }).createComponent(HeroBannerComponent);

    fixture.detectChanges();
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('h1')?.textContent).toContain('Bruny Shopping');
    expect(element.textContent).toContain('Édition Douala & Yaoundé 2025');

    const image = element.querySelector('img');
    expect(image?.getAttribute('fetchpriority')).toBe('high');
  });
});
