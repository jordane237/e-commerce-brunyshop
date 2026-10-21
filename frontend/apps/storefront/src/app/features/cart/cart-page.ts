import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartStore } from '@bruny/data-access';
import { FcfaPipe } from '@bruny/util';

@Component({
  standalone: true,
  selector: 'bruny-cart-page',
  imports: [RouterLink, FcfaPipe],
  template: `
    <section class="container cart-page">
      <p class="eyebrow">VOTRE SÉLECTION</p>
      <h1>Mon panier</h1>
      @if (!cart.lines().length) {
        <div class="empty">
          <h2>Votre panier est vide</h2>
          <p>Explorez la boutique et ajoutez votre prochaine paire.</p>
          <a routerLink="/boutique">Découvrir la boutique</a>
        </div>
      } @else {
        <div class="layout">
          <div class="lines">
            @for (line of cart.lines(); track line.variantId) {
              <article class="line">
                @if (line.image) {
                  <img [src]="line.image" [alt]="line.name" width="120" height="120" />
                }
                <div class="info">
                  <a [routerLink]="['/produit', line.slug]">{{ line.name }}</a>
                  <p>{{ line.color }} · Pointure {{ line.size }} · Quantité {{ line.quantity }}</p>
                  <strong>{{ line.unitPrice | fcfa }}</strong>
                </div>
                <button
                  type="button"
                  (click)="cart.remove(line.variantId)"
                  [attr.aria-label]="'Retirer ' + line.name"
                >
                  Retirer
                </button>
              </article>
            }
          </div>
          <aside class="summary">
            <h2>Récapitulatif</h2>
            <p>
              <span>{{ cart.count() }} article(s)</span><strong>{{ cart.total() | fcfa }}</strong>
            </p>
            <button type="button" disabled>Continuer la commande</button
            ><small>Les frais de livraison seront calculés lors de la commande.</small>
          </aside>
        </div>
      }
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .cart-page {
        padding-block: 48px 70px;
      }
      .eyebrow {
        font-size: 0.72rem;
        font-weight: 800;
        letter-spacing: 0.14em;
        color: #9a7b14;
      }
      .cart-page h1 {
        font-size: 2.2rem;
        margin: 8px 0 28px;
      }
      .empty {
        padding: 70px 24px;
        text-align: center;
        background: #f7f7f6;
        border-radius: 16px;
      }
      .empty p {
        color: #687087;
      }
      .empty a {
        display: inline-block;
        margin-top: 12px;
        background: #1f2a44;
        color: #fff;
        padding: 12px 18px;
        border-radius: 8px;
        text-decoration: none;
      }
      .layout {
        display: grid;
        grid-template-columns: 1fr 320px;
        gap: 28px;
      }
      .lines {
        display: grid;
        gap: 12px;
      }
      .line {
        display: flex;
        align-items: center;
        gap: 18px;
        background: white;
        border: 1px solid #eceef2;
        padding: 14px;
        border-radius: 12px;
      }
      .line img {
        width: 96px;
        height: 96px;
        object-fit: cover;
        border-radius: 8px;
        background: #f4f3ef;
      }
      .info {
        flex: 1;
      }
      .info a {
        color: #1f2a44;
        font-weight: 800;
        text-decoration: none;
      }
      .info p {
        color: #687087;
        font-size: 0.85rem;
      }
      .line > button {
        border: 0;
        color: #a5232d;
        background: none;
        cursor: pointer;
      }
      .summary {
        padding: 22px;
        background: #f7f7f6;
        border-radius: 12px;
        height: max-content;
      }
      .summary p {
        display: flex;
        justify-content: space-between;
        padding-block: 12px;
        border-block: 1px solid #dedfe4;
      }
      .summary button {
        width: 100%;
        height: 46px;
        border: 0;
        border-radius: 8px;
        background: #1f2a44;
        color: white;
        font-weight: 700;
      }
      .summary button:disabled {
        opacity: 0.55;
      }
      .summary small {
        display: block;
        margin-top: 12px;
        color: #687087;
        line-height: 1.5;
      }
      @media (max-width: 760px) {
        .layout {
          grid-template-columns: 1fr;
        }
        .line {
          gap: 10px;
        }
        .line img {
          width: 72px;
          height: 72px;
        }
      }
    `,
  ],
})
export class CartPage {
  readonly cart = inject(CartStore);
}
