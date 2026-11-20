import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IconComponent, type IconName } from '../icon/icon.component';

export interface ReassurancePoint {
  readonly icon: IconName;
  readonly label: string;
  readonly description?: string;
}

@Component({
  selector: 'bruny-reassurance-band',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  templateUrl: './reassurance-band.component.html',
  styleUrl: './reassurance-band.component.scss',
})
export class ReassuranceBandComponent {
  readonly points = input.required<readonly ReassurancePoint[]>();
  readonly ariaLabel = input('Nos engagements');
}
