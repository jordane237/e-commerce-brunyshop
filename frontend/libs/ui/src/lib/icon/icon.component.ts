import { ChangeDetectionStrategy, Component, Input, computed, signal } from '@angular/core';

export type IconName =
  | 'search'
  | 'chevron-down'
  | 'chevron-up'
  | 'chevron-left'
  | 'chevron-right'
  | 'check'
  | 'check-circle'
  | 'close'
  | 'menu'
  | 'cart'
  | 'whatsapp'
  | 'heart'
  | 'arrow-right'
  | 'plus'
  | 'minus'
  | 'alert'
  | 'info'
  | 'trash'
  | 'edit'
  | 'eye'
  | 'eye-off'
  | 'sort'
  | 'phone'
  | 'map-pin'
  | 'filter'
  | 'refresh'
  | 'user'
  | 'lock';

const ICONS: Record<IconName, readonly string[]> = {
  search: ['M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z', 'm21 21-4.35-4.35'],
  'chevron-down': ['m6 9 6 6 6-6'],
  'chevron-up': ['m18 15-6-6-6 6'],
  'chevron-left': ['m15 18-6-6 6-6'],
  'chevron-right': ['m9 18 6-6-6-6'],
  check: ['m5 12 5 5L20 7'],
  'check-circle': ['M22 11.1V12a10 10 0 1 1-5.9-9.1', 'm9 11 3 3L22 4'],
  close: ['M6 6l12 12', 'M18 6 6 18'],
  menu: ['M4 7h16', 'M4 12h16', 'M4 17h16'],
  cart: [
    'M6 6h15l-1.5 9h-12z',
    'M6 6 5 3H2',
    'M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z',
    'M18 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z',
  ],
  whatsapp: [
    'M21 11.5a8.5 8.5 0 0 1-12.8 7.4L3 21l2.1-5.2A8.5 8.5 0 1 1 21 11.5Z',
    'M8.5 9.5c.5 3 2.5 5 5.5 5.5',
  ],
  heart: [
    'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z',
  ],
  'arrow-right': ['M5 12h14', 'm13 6 6 6-6 6'],
  plus: ['M12 5v14', 'M5 12h14'],
  minus: ['M5 12h14'],
  alert: ['M12 3 2 21h20L12 3Z', 'M12 9v5', 'M12 17h.01'],
  info: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z', 'M12 11v6', 'M12 7h.01'],
  trash: ['M3 6h18', 'M8 6V4h8v2', 'M19 6l-1 15H6L5 6', 'M10 11v6', 'M14 11v6'],
  edit: ['M12 20h9', 'M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z'],
  eye: ['M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z', 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z'],
  'eye-off': [
    'M3 3l18 18',
    'M10.6 10.6a3 3 0 0 0 4.2 4.2',
    'M9.9 5.2A10.7 10.7 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-2.2 3.2',
    'M6.2 6.2A17 17 0 0 0 2 12s3.5 7 10 7c1.4 0 2.6-.3 3.8-.8',
  ],
  sort: ['M7 15l5 5 5-5', 'M7 9l5-5 5 5'],
  phone: [
    'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2Z',
  ],
  'map-pin': [
    'M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0Z',
    'M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  ],
  filter: ['M22 3H2l8 9.5V19l4 2v-8.5L22 3Z'],
  refresh: ['M21 12a9 9 0 1 1-2.6-6.4', 'M21 3v6h-6'],
  user: ['M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2', 'M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z'],
  lock: ['M5 11h14v10H5z', 'M8 11V7a4 4 0 0 1 8 0v4'],
};

@Component({
  selector: 'bruny-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      [attr.width]="size"
      [attr.height]="size"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      [attr.role]="label ? 'img' : null"
      [attr.aria-label]="label || null"
      [attr.aria-hidden]="label ? null : 'true'"
      focusable="false"
    >
      @for (path of paths(); track $index) {
        <path [attr.d]="path" />
      }
    </svg>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex: none;
        line-height: 0;
      }
    `,
  ],
})
export class IconComponent {
  private readonly nameState = signal<IconName>('info');

  @Input({ required: true })
  set name(value: IconName) {
    this.nameState.set(value);
  }
  get name(): IconName {
    return this.nameState();
  }

  @Input() size = 20;
  @Input() label = '';

  readonly paths = computed(() => ICONS[this.nameState()] ?? ICONS.info);
}
