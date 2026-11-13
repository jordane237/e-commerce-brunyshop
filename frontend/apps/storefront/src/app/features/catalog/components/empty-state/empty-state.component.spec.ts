import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { EmptyStateComponent } from './empty-state.component';

describe('EmptyStateComponent', () => {
  it('renders the canonical message, suggestions and reset action', async () => {
    const fixture = TestBed.configureTestingModule({
      imports: [EmptyStateComponent],
      providers: [provideRouter([])],
    }).createComponent(EmptyStateComponent);
    fixture.componentRef.setInput('suggestions', [{ name: 'Sneakers', slug: 'sneakers' }]);
    fixture.detectChanges();
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('[role="status"]')).not.toBeNull();
    expect(element.textContent).toContain('Aucun résultat');
    expect(element.textContent).toContain('Essayez un autre mot-clé ou retirez un filtre.');
    expect(element.textContent).toContain('Sneakers');
    expect(element.textContent).toContain('Voir les nouveautés');
  });

  it('emits reset when the primary action is clicked', async () => {
    const fixture = TestBed.configureTestingModule({
      imports: [EmptyStateComponent],
      providers: [provideRouter([])],
    }).createComponent(EmptyStateComponent);
    let reset = false;
    fixture.componentInstance.reset.subscribe(() => (reset = true));
    fixture.detectChanges();
    await fixture.whenStable();

    (fixture.nativeElement.querySelector('.empty__reset') as HTMLButtonElement).click();

    expect(reset).toBe(true);
  });
});
