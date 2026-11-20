import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { TableOfContentsComponent, type TocSection } from './table-of-contents.component';

const SECTIONS: readonly TocSection[] = [
  { id: 'histoire', title: 'Notre histoire', level: 2 },
  { id: 'engagements', title: 'Nos engagements', level: 2 },
];

describe('TableOfContentsComponent', () => {
  async function create() {
    await TestBed.configureTestingModule({
      imports: [TableOfContentsComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(TableOfContentsComponent);
    fixture.componentRef.setInput('sections', SECTIONS);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture;
  }

  it('renders an accessible summary with anchor links', async () => {
    const fixture = await create();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('nav')?.getAttribute('aria-label')).toBe('Sommaire de la page');
    expect(element.querySelectorAll('.toc__link')).toHaveLength(2);
    expect(element.querySelector('.toc__link')?.getAttribute('href')).toBe('#histoire');
    expect(element.querySelector('.toc__link')?.getAttribute('aria-current')).toBeNull();
  });

  it('focuses the target section and updates the URL and active state', async () => {
    const fixture = await create();
    const target = document.createElement('section');
    target.id = 'histoire';
    document.body.appendChild(target);
    const scrollIntoView = vi.fn();
    target.scrollIntoView = scrollIntoView;

    const link = fixture.nativeElement.querySelector('.toc__link') as HTMLAnchorElement;
    link.click();
    fixture.detectChanges();

    expect(scrollIntoView).toHaveBeenCalledOnce();
    expect(target.getAttribute('tabindex')).toBe('-1');
    expect(document.activeElement).toBe(target);
    expect(window.location.hash).toBe('#histoire');
    expect(link.getAttribute('aria-current')).toBe('true');

    target.remove();
  });
});
