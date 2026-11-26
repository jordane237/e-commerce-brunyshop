import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ButtonComponent } from '../button/button.component';

export interface BulkAction {
  label: string;
  icon?: string;
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

@Component({
  selector: 'bruny-bulk-actions-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent],
  templateUrl: './bulk-actions-bar.component.html',
  styleUrl: './bulk-actions-bar.component.scss',
})
export class BulkActionsBarComponent {
  readonly count = input<number>(0);
  readonly actions = input<BulkAction[]>([]);
  readonly clear = output<void>();
}
