import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

export interface EmptyStateSuggestion {
  name: string;
  slug: string;
}

/**
 * État « Aucun résultat » : message, conseil, réinitialisation et suggestions.
 * `role="status"` annonce le changement sans voler le focus.
 */
@Component({
  selector: 'bruny-empty-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.scss',
})
export class EmptyStateComponent {
  readonly suggestions = input<EmptyStateSuggestion[]>([]);
  readonly reset = output<void>();
}
