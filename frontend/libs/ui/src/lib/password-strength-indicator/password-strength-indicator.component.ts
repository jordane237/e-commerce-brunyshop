import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { COMMON_PASSWORDS } from '@bruny/util';
import { IconComponent } from '../icon/icon.component';

export type PasswordStrength = 'weak' | 'medium' | 'good' | 'excellent';

export interface PasswordCriteria {
  minLength: boolean;
  maxLength: boolean;
  notCommon: boolean;
  hasVariety: boolean;
}

@Component({
  selector: 'bruny-password-strength-indicator',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './password-strength-indicator.component.html',
  styleUrl: './password-strength-indicator.component.scss',
})
export class PasswordStrengthIndicatorComponent {
  readonly password = input.required<string>();
  readonly minLength = input(10);
  readonly maxLength = input(128);

  readonly criteria = computed<PasswordCriteria>(() => {
    const password = this.password();
    const classes =
      Number(/[a-z]/.test(password)) +
      Number(/[A-Z]/.test(password)) +
      Number(/[0-9]/.test(password)) +
      Number(/[^a-zA-Z0-9]/.test(password));

    return {
      minLength: password.length >= this.minLength(),
      maxLength: password.length <= this.maxLength(),
      notCommon: password.length > 0 && !COMMON_PASSWORDS.has(password.toLowerCase()),
      hasVariety: classes >= 2,
    };
  });

  readonly level = computed(() => {
    const password = this.password();
    const criteria = this.criteria();
    if (password.length === 0) return 0;
    if (!criteria.notCommon || !criteria.minLength || !criteria.maxLength) return 1;
    if (!criteria.hasVariety) return 2;
    const longAndVaried = password.length >= this.minLength() + 2;
    return longAndVaried && /[0-9]/.test(password) && /[^a-zA-Z0-9]/.test(password) ? 4 : 3;
  });

  readonly strength = computed<PasswordStrength>(() => {
    const level = this.level();
    if (level <= 1) return 'weak';
    if (level === 2) return 'medium';
    if (level === 3) return 'good';
    return 'excellent';
  });

  readonly label = computed(
    () =>
      ({
        weak: 'Faible',
        medium: 'Moyen',
        good: 'Bon',
        excellent: 'Excellent',
      })[this.strength()],
  );

  readonly segments = [1, 2, 3, 4];
}
