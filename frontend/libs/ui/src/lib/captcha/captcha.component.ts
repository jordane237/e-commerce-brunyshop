import { PLATFORM_ID } from '@angular/core';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NgxTurnstileComponent, NgxTurnstileFormsModule } from 'ngx-turnstile';

@Component({
  selector: 'bruny-captcha',
  standalone: true,
  imports: [ReactiveFormsModule, NgxTurnstileFormsModule, NgxTurnstileComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isBrowser() && siteKey()) {
      <div class="captcha-shell">
        <ngx-turnstile
          [siteKey]="siteKey()!"
          [formControl]="control()"
          [appearance]="appearance()"
          [theme]="'auto'"
          [action]="action()"
          [responseField]="false"
          (resolved)="resolved.emit($event)"
          (errored)="onError($event)"
          (timeout)="onTimeout()"
        />
      </div>
    }
    @if (error()) {
      <p class="captcha-error" role="alert" aria-live="polite">{{ error() }}</p>
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .captcha-shell {
        min-height: 1px;
      }

      .captcha-error {
        color: var(--color-error, #a5232d);
        font-size: 0.85rem;
        line-height: 1.45;
        margin: 6px 0 0;
      }
    `,
  ],
})
export class CaptchaComponent {
  readonly siteKey = input<string | null>(null);
  readonly control = input.required<FormControl<string | null>>();
  readonly appearance = input<'always' | 'execute' | 'interaction-only'>('interaction-only');
  readonly action = input<string>('default');
  readonly resolved = output<string | null>();
  readonly error = signal<string | null>(null);

  private readonly platformId = inject(PLATFORM_ID);
  readonly isBrowser = computed(() => isPlatformBrowser(this.platformId));

  onError(_code: string | null): void {
    this.error.set(
      'Vérification indisponible. Désactivez votre bloqueur de publicité ou réessayez.',
    );
  }

  onTimeout(): void {
    this.error.set('La vérification prend trop de temps. Réessayez dans un instant.');
  }
}
