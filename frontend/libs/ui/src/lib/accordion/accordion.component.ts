import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { IconComponent } from '../icon/icon.component';

export interface AccordionItem {
  readonly id: string;
  readonly question: string;
  readonly answer: string;
}

@Component({
  selector: 'bruny-accordion',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './accordion.component.html',
  styleUrl: './accordion.component.scss',
})
export class AccordionComponent {
  readonly items = input.required<readonly AccordionItem[]>();
  readonly openId = signal<string | null>(null);

  toggle(id: string): void {
    this.openId.update((current) => (current === id ? null : id));
  }
}
