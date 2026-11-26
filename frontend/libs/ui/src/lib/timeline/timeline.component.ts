import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DatePipe } from '@angular/common';

import { IconComponent, type IconName } from '../icon/icon.component';

export interface TimelineEntry {
  status: string;
  label: string;
  date: string | null;
  isCurrent: boolean;
  isCompleted: boolean;
}

@Component({
  selector: 'bruny-timeline',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, IconComponent],
  templateUrl: './timeline.component.html',
  styleUrl: './timeline.component.scss',
})
export class TimelineComponent {
  readonly entries = input.required<TimelineEntry[]>();
  readonly ariaLabel = input<string>('Chronologie de la commande');

  iconFor(entry: TimelineEntry): IconName | null {
    if (entry.isCompleted) return 'check';
    return null;
  }
}
