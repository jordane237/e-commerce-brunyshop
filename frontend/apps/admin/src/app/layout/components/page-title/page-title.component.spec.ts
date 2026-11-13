import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { RouteMetaService } from '../../navigation/route-meta.service';
import { PageTitleComponent } from './page-title.component';

@Component({
  standalone: true,
  imports: [PageTitleComponent],
  template: `<bruny-page-title
    ><button page-actions type="button">Créer</button></bruny-page-title
  >`,
})
class HostComponent {}

describe('PageTitleComponent', () => {
  it('renders the route title as the only h1 and projects actions', async () => {
    const fixture = TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [
        {
          provide: RouteMetaService,
          useValue: { title: signal('Produits'), breadcrumbs: signal([]) },
        },
      ],
    }).createComponent(HostComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelectorAll('h1')).toHaveLength(1);
    expect(fixture.nativeElement.querySelector('h1')?.textContent).toContain('Produits');
    expect(fixture.nativeElement.querySelector('[page-actions]')?.textContent).toContain('Créer');
  });
});
