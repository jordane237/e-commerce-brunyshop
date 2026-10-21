import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  imports: [RouterLink],
  template: `<section class="denied">
    <p>403</p>
    <h1>Accès non autorisé</h1>
    <a routerLink="/">Retour</a>
  </section>`,
  styles: [
    `
      .denied {
        padding: 100px 24px;
        text-align: center;
      }
      .denied p {
        font-size: 4rem;
        color: #c9a227;
        font-weight: 900;
        margin: 0;
      }
      .denied a {
        display: inline-block;
        background: #1f2a44;
        color: #fff;
        padding: 10px 15px;
        border-radius: 7px;
        text-decoration: none;
      }
    `,
  ],
})
export class AccessDeniedPage {}
