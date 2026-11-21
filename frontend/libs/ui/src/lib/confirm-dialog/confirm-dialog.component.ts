import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ModalComponent } from '../modal/modal.component';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'bruny-confirm-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ModalComponent, ButtonComponent],
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.scss',
})
export class ConfirmDialogComponent {
  readonly open = input<boolean>(false);
  readonly title = input<string>('Confirmation');
  readonly message = input<string>('');
  readonly confirmLabel = input<string>('Confirmer');
  readonly cancelLabel = input<string>('Annuler');
  readonly tone = input<'neutral' | 'danger'>('danger');
  readonly loading = input<boolean>(false);

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  onModalChange(value: boolean): void {
    if (!value) this.cancelled.emit();
  }
}
