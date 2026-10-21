import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { CartStore } from '@bruny/data-access';
import { ToastComponent } from '@bruny/ui';
import { httpErrorMessage } from '@bruny/data-access';

@Component({
  imports: [RouterLink, RouterOutlet, ToastComponent],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  readonly cart = inject(CartStore);
  readonly errorMessage = httpErrorMessage;
}
