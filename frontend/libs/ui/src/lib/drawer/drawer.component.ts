import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { A11yModule } from '@angular/cdk/a11y';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import {
  afterNextRender,
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  Injector,
  input,
  model,
  OnDestroy,
  PLATFORM_ID,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { IconComponent } from '../icon/icon.component';

let nextDrawerId = 0;

/**
 * Tiroir latéral accessible basé sur CDK Overlay.
 *
 * Le contenu est rendu dans un portail uniquement côté navigateur. Le focus
 * est piégé dans le tiroir, Échap et le backdrop ferment, puis le focus revient
 * au déclencheur.
 */
@Component({
  selector: 'bruny-drawer',
  standalone: true,
  imports: [A11yModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './drawer.component.html',
  styleUrl: './drawer.component.scss',
})
export class DrawerComponent implements AfterViewInit, OnDestroy {
  readonly isOpen = model(false);
  readonly title = input.required<string>();
  readonly side = input<'left' | 'right'>('right');
  readonly closeOnBackdrop = input(true);
  readonly closeOnEscape = input(true);
  readonly closeLabel = input('Fermer');

  readonly titleId = `bruny-drawer-title-${++nextDrawerId}`;

  @ViewChild('drawerTemplate', { read: TemplateRef })
  private drawerTemplate?: TemplateRef<unknown>;

  private readonly overlay = inject(Overlay);
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly injector = inject(Injector);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly browser = isPlatformBrowser(this.platformId);

  private overlayRef: OverlayRef | null = null;
  private subscriptions = new Subscription();
  private previousFocus: HTMLElement | null = null;

  constructor() {
    // Le ViewChild n'est disponible qu'après le premier rendu.
    afterNextRender(() => {
      if (!this.browser) return;
      effect(
        () => {
          if (this.isOpen()) this.attach();
          else this.detach();
        },
        { injector: this.injector },
      );
    });
  }

  ngAfterViewInit(): void {
    if (this.isOpen()) this.attach();
  }

  ngOnDestroy(): void {
    this.detach(false);
  }

  close(): void {
    if (!this.isOpen()) return;
    this.detach();
    this.isOpen.set(false);
  }

  private attach(): void {
    if (!this.browser || this.overlayRef !== null || !this.drawerTemplate) return;

    this.previousFocus = this.document.activeElement as HTMLElement | null;

    const position =
      this.side() === 'left'
        ? this.overlay.position().global().top('0').bottom('0').left('0')
        : this.overlay.position().global().top('0').bottom('0').right('0');

    const overlayRef = this.overlay.create({
      hasBackdrop: true,
      backdropClass: 'bruny-drawer-backdrop',
      positionStrategy: position,
      scrollStrategy: this.overlay.scrollStrategies.block(),
      width: 'min(400px, 100vw)',
      height: '100%',
    });

    overlayRef.hostElement.style.zIndex = 'var(--bs-z-overlay)';
    overlayRef.backdropElement?.style.setProperty('background-color', 'var(--bs-color-overlay)');
    overlayRef.attach(new TemplatePortal(this.drawerTemplate, this.viewContainerRef));
    this.overlayRef = overlayRef;

    this.subscriptions.add(
      overlayRef.backdropClick().subscribe(() => {
        if (this.closeOnBackdrop()) this.close();
      }),
    );
    this.subscriptions.add(
      overlayRef.keydownEvents().subscribe((event) => {
        if (event.key !== 'Escape' || !this.closeOnEscape()) return;
        event.preventDefault();
        this.close();
      }),
    );
  }

  private detach(restoreFocus = true): void {
    this.subscriptions.unsubscribe();
    this.subscriptions = new Subscription();
    this.overlayRef?.dispose();
    this.overlayRef = null;

    const target = this.previousFocus;
    this.previousFocus = null;
    if (restoreFocus) target?.focus();
  }
}
