import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthChallenge, SessionService, TwoFactorSetup } from '@bruny/data-access';
import { errorMessage } from '../../core/http';

@Component({
  standalone: true,
  selector: 'bruny-login-page',
  imports: [ReactiveFormsModule],
  template: `
    <section class="login-layout">
      <div class="brand-panel">
        <a class="brand">BRUNY <span>SHOPPING</span></a>
        <p>Votre activité, en un seul endroit.</p>
      </div>
      <div class="form-panel">
        <form [formGroup]="form" (ngSubmit)="login()">
          <p class="eyebrow">ESPACE PROFESSIONNEL</p>
          <h1>Connexion</h1>
          <p class="subtitle">Connectez-vous pour gérer votre catalogue.</p>
          @if (errorMessage()) {
            <p class="error" role="alert">{{ errorMessage() }}</p>
          }
          <label
            >Email ou téléphone<input
              formControlName="identifier"
              autocomplete="username"
              placeholder="admin@exemple.cm"
          /></label>
          <label
            >Mot de passe<input
              type="password"
              formControlName="password"
              autocomplete="current-password"
              placeholder="Votre mot de passe"
          /></label>
          <button [disabled]="form.invalid || busy()">
            {{ busy() ? 'Connexion…' : 'Se connecter' }}
          </button>
        </form>
        @if (challenge()) {
          <form class="challenge" [formGroup]="codeForm" (ngSubmit)="verify()">
            @if (setup()) {
              <h2>Activez la double authentification</h2>
              <p>
                Ajoutez cette clé dans une application d’authentification, puis saisissez le code
                affiché.
              </p>
              <code>{{ setup()!.secret }}</code>
              <details>
                <summary>Codes de secours — à conserver en lieu sûr</summary>
                <p>{{ setup()!.backupCodes.join(' · ') }}</p>
              </details>
            } @else {
              <h2>Vérification en deux étapes</h2>
              <p>Saisissez le code de votre application ou un code de secours.</p>
            }
            <label
              >Code<input formControlName="code" inputmode="numeric" autocomplete="one-time-code"
            /></label>
            <button [disabled]="codeForm.invalid || busy()">Valider le code</button>
          </form>
        }
      </div>
    </section>
  `,
  styles: [
    `
      :host {
        display: grid;
        min-height: 100vh;
        place-items: center;
        padding: 24px;
      }
      .login-layout {
        width: min(980px, 100%);
        min-height: 570px;
        display: grid;
        grid-template-columns: 0.8fr 1.2fr;
        background: #fff;
        border-radius: 22px;
        overflow: hidden;
        box-shadow: 0 24px 70px #1f2a441a;
      }
      .brand-panel {
        background: #1f2a44;
        color: white;
        padding: 48px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }
      .brand {
        font-size: 1.6rem;
        font-weight: 900;
        letter-spacing: 0.08em;
      }
      .brand span {
        color: #c9a227;
      }
      .brand-panel p {
        font-size: 2rem;
        line-height: 1.2;
        font-weight: 700;
      }
      .form-panel {
        padding: 54px;
        align-self: center;
      }
      .form-panel form {
        display: grid;
        gap: 17px;
      }
      .eyebrow {
        color: #9a7b14;
        font-size: 0.7rem;
        font-weight: 800;
        letter-spacing: 0.15em;
        margin: 0;
      }
      .form-panel h1 {
        font-size: 2.2rem;
        margin: 0;
      }
      .subtitle,
      .challenge p {
        color: #687087;
      }
      .form-panel label {
        display: grid;
        gap: 7px;
        font-size: 0.85rem;
        font-weight: 700;
      }
      .form-panel input {
        height: 48px;
        padding: 0 13px;
        border: 1px solid #dce0e7;
        border-radius: 8px;
      }
      .form-panel button {
        height: 48px;
        border: 0;
        border-radius: 8px;
        background: #1f2a44;
        color: #fff;
        font-weight: 700;
        cursor: pointer;
      }
      .form-panel button:disabled {
        opacity: 0.5;
      }
      .error {
        padding: 12px;
        border-radius: 8px;
        background: #fff0f0;
        color: #a5232d;
      }
      .challenge {
        margin-top: 30px;
        padding-top: 24px;
        border-top: 1px solid #e6e8ed;
      }
      .challenge h2 {
        margin: 0;
        font-size: 1.2rem;
      }
      .challenge code {
        padding: 12px;
        background: #f4f3ef;
        border-radius: 8px;
        overflow-wrap: anywhere;
      }
      @media (max-width: 650px) {
        .login-layout {
          grid-template-columns: 1fr;
        }
        .brand-panel {
          min-height: 150px;
          padding: 25px;
        }
        .brand-panel p {
          font-size: 1.2rem;
          margin-bottom: 0;
        }
        .form-panel {
          padding: 30px 22px;
        }
      }
    `,
  ],
})
export class LoginPage {
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly errorMessage = errorMessage;
  readonly busy = signal(false);
  readonly challenge = signal<AuthChallenge | null>(null);
  readonly setup = signal<TwoFactorSetup | null>(null);
  readonly form = this.fb.group({
    identifier: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });
  readonly codeForm = this.fb.group({
    code: ['', [Validators.required, Validators.pattern(/^(?:[0-9]{6}|[0-9]{8})$/)]],
  });

  login(): void {
    if (this.form.invalid) return;
    this.busy.set(true);
    this.errorMessage.set('');
    const { identifier, password } = this.form.getRawValue();
    this.session.login(identifier, password).subscribe({
      next: (result) => {
        if ('accessToken' in result) {
          this.completeLogin();
          return;
        }
        this.challenge.set(result);
        if (result.setupRequired) {
          this.session.setupTwoFactor(result.challengeToken).subscribe({
            next: (setup) => {
              this.setup.set(setup);
              this.busy.set(false);
            },
            error: () => this.busy.set(false),
          });
        } else this.busy.set(false);
      },
      error: () => this.busy.set(false),
    });
  }

  verify(): void {
    const challenge = this.challenge();
    const code = this.codeForm.controls.code.value;
    if (!challenge || this.codeForm.invalid) return;
    this.busy.set(true);
    this.session.verifyTwoFactor(challenge.challengeToken, code).subscribe({
      next: () => this.completeLogin(),
      error: () => this.busy.set(false),
    });
  }

  private completeLogin(): void {
    const destination = this.route.snapshot.queryParamMap.get('returnUrl') || '/produits';
    this.busy.set(false);
    void this.router.navigateByUrl(destination.startsWith('/') ? destination : '/produits');
  }
}
