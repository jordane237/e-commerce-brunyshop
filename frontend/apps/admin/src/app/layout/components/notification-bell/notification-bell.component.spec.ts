import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { NotificationBellComponent } from './notification-bell.component';

async function create(count = 0) {
  const fixture = TestBed.configureTestingModule({
    imports: [NotificationBellComponent],
  }).createComponent(NotificationBellComponent);
  fixture.componentRef.setInput('unreadCount', count);
  fixture.detectChanges();
  await fixture.whenStable();
  return fixture;
}

describe('NotificationBellComponent', () => {
  it('shows a zero-count accessible trigger and the empty dropdown', async () => {
    const fixture = await create();
    const button = fixture.nativeElement.querySelector('.bell__trigger') as HTMLButtonElement;

    expect(button.getAttribute('aria-label')).toBe('Notifications (0 non lues)');
    expect(fixture.nativeElement.querySelector('.bell__count')).toBeNull();

    button.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Aucune nouvelle notification');
  });

  it('shows the badge when notifications exist and closes with Échap', async () => {
    const fixture = await create(3);
    expect(fixture.nativeElement.querySelector('.bell__count')?.textContent).toContain('3');

    (fixture.nativeElement.querySelector('.bell__trigger') as HTMLButtonElement).click();
    fixture.detectChanges();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('#admin-notifications')).toBeNull();
  });
});
