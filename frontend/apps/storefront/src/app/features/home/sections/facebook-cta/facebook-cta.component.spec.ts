import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { FacebookCtaComponent } from './facebook-cta.component';

describe('FacebookCtaComponent', () => {
  it('opens Facebook in a new tab with a safe rel and an aria-label', () => {
    const fixture = TestBed.configureTestingModule({
      imports: [FacebookCtaComponent],
    }).createComponent(FacebookCtaComponent);

    fixture.componentRef.setInput('url', 'https://www.facebook.com/BrunyShopping');
    fixture.detectChanges();

    const link = (fixture.nativeElement as HTMLElement).querySelector<HTMLAnchorElement>('a');
    expect(link?.href).toBe('https://www.facebook.com/BrunyShopping');
    expect(link?.target).toBe('_blank');
    expect(link?.rel).toBe('noopener noreferrer');
    expect(link?.getAttribute('aria-label')).toBe('Suivez-nous sur Facebook (nouvel onglet)');
  });
});
