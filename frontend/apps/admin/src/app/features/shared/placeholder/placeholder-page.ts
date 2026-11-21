import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IconComponent } from '@bruny/ui';

/**
 * Contenu temporaire des modules dont l'API n'existe pas encore.
 * Le titre et le fil d'Ariane viennent des données de route, pas d'un faux
 * contenu métier.
 */
@Component({
  selector: 'bruny-admin-placeholder',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `
    <section class="placeholder" role="status">
      <span class="placeholder__icon" aria-hidden="true">
        <bruny-icon name="layers" [size]="30" />
      </span>
      <h2>Page en construction</h2>
      <p>Le contenu de ce module sera ajouté dans un prochain ticket.</p>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .placeholder {
        display: grid;
        justify-items: center;
        gap: var(--bs-space-2);
        padding: var(--bs-space-12) var(--bs-space-4);
        border: 1px dashed var(--bs-color-border-strong);
        border-radius: var(--bs-radius-lg);
        background: var(--bs-color-surface);
        text-align: center;
      }
      .placeholder__icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 64px;
        height: 64px;
        border-radius: var(--bs-radius-full);
        background: var(--bs-color-primary-soft);
        color: var(--bs-color-primary);
      }
      h2 {
        margin: 0;
        color: var(--bs-color-text);
        font-size: var(--bs-font-size-xl);
      }
      p {
        margin: 0;
        color: var(--bs-color-text-muted);
      }
    `,
  ],
})
export class PlaceholderPage {}
