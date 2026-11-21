import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, SessionService, ToastService } from '@bruny/core';
import { ButtonComponent } from '@bruny/ui';

@Component({
  selector: 'app-account-page',
  standalone: true,
  imports: [ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="account-page">
      <p class="account-page__eyebrow">ESPACE CLIENT</p>
      <h1>Mon compte</h1>
      <p class="account-page__welcome">
        Bonjour{{ firstName() ? ' ' + firstName() : '' }}, votre espace client est prêt.
      </p>
      <p class="account-page__note">
        Le tableau de bord complet arrive avec les écrans de compte. Vos commandes, adresses et
        favoris seront disponibles ici.
      </p>
      <bruny-button variant="primary" [loading]="loggingOut()" (click)="logout()">
        Se déconnecter
      </bruny-button>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 60vh;
      }
      .account-page {
        width: min(680px, calc(100% - 40px));
        margin: 48px auto;
        display: grid;
        gap: 16px;
      }
      .account-page__eyebrow {
        margin: 0;
        color: var(--bs-color-accent-text);
        font-size: 0.7rem;
        font-weight: 800;
        letter-spacing: 0.12em;
      }
      h1 {
        margin: 0;
        color: var(--bs-color-text);
      }
      .account-page__welcome {
        margin: 0;
        font-size: 1.1rem;
        font-weight: 700;
      }
      .account-page__note {
        margin: 0 0 8px;
        color: var(--bs-color-text-muted);
        line-height: 1.6;
      }
    `,
  ],
})
export class AccountPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  readonly session = inject(SessionService);
  readonly loggingOut = signal(false);

  firstName(): string | null {
    return this.session.user()?.firstName ?? null;
  }

  logout(): void {
    this.loggingOut.set(true);
    this.auth.logout().subscribe({
      next: () => {
        this.toast.success('Vous êtes déconnecté.');
        void this.router.navigateByUrl('/connexion');
      },
      error: () => {
        this.loggingOut.set(false);
        void this.router.navigateByUrl('/connexion');
      },
    });
  }
}
