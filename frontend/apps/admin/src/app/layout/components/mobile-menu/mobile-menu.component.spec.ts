import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SessionService } from '@bruny/core';
import { describe, expect, it } from 'vitest';
import { AdminMobileMenuComponent } from './mobile-menu.component';

function session() {
  return {
    user: signal({ id: '1', roles: ['ADMIN'] }),
    userRoles: signal(['ADMIN']),
    hasAnyRole: (roles: string[]) => roles.includes('ADMIN'),
  };
}

async function create(open: boolean) {
  const fixture = TestBed.configureTestingModule({
    imports: [AdminMobileMenuComponent],
    providers: [provideRouter([]), { provide: SessionService, useValue: session() }],
  }).createComponent(AdminMobileMenuComponent);
  fixture.componentRef.setInput('open', open);
  fixture.detectChanges();
  await fixture.whenStable();
  return fixture;
}

describe('AdminMobileMenuComponent', () => {
  it('renders nothing when closed', async () => {
    const fixture = await create(false);
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
  });

  it('renders the full menu with labels and closes with Échap', async () => {
    const fixture = await create(true);
    let closed = false;
    fixture.componentInstance.closed.subscribe(() => (closed = true));
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('[role="dialog"]')?.getAttribute('aria-modal')).toBe('true');
    expect(element.textContent).toContain('Audit');
    expect(element.textContent).toContain('Paramètres');
    expect(fixture.componentInstance['document'].body.style.overflow).toBe('hidden');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(closed).toBe(true);
  });
});
