import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { ReassuranceBandComponent } from './reassurance-band.component';

describe('ReassuranceBandComponent', () => {
  it('renders the four assurance items and hides decorative icons', () => {
    const fixture = TestBed.configureTestingModule({
      imports: [ReassuranceBandComponent],
    }).createComponent(ReassuranceBandComponent);

    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Garanties Bruny Shopping');
    expect(element.querySelectorAll('.assurance__item').length).toBe(4);
    expect(element.querySelector('.assurance__icon')?.getAttribute('aria-hidden')).toBe('true');
  });
});
