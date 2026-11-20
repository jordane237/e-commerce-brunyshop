import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'bruny-cgv-checkbox',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cgv-checkbox.component.html',
  styleUrl: './cgv-checkbox.component.scss',
})
export class CgvCheckboxComponent {
  readonly control = input.required<FormControl<boolean>>();
  readonly error = input<string | null>(null);
  readonly inputId = input('cgv');
}
