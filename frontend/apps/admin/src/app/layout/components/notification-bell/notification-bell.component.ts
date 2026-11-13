import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { IconComponent } from '@bruny/ui';

/**
 * Placeholder BO-01 : aucun endpoint de centre de notifications n'existe.
 * Le composant accepte déjà un compteur pour le brancher sur NTF-* plus tard.
 */
@Component({
  selector: 'bruny-notification-bell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  templateUrl: './notification-bell.component.html',
  styleUrl: './notification-bell.component.scss',
})
export class NotificationBellComponent {
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  readonly unreadCount = input(0);
  readonly open = signal(false);

  readonly label = computed(() => {
    const count = this.unreadCount();
    return count === 1 ? 'Notifications (1 non lue)' : `Notifications (${count} non lues)`;
  });

  toggle(): void {
    this.open.update((open) => !open);
  }

  close(): void {
    this.open.set(false);
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.open()) this.close();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.open()) return;
    const target = event.target;
    if (target instanceof Node && !this.elementRef.nativeElement.contains(target)) {
      this.close();
    }
  }
}
