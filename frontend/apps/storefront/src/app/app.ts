import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { CartStore } from '@bruny/data-access';
import { ToastService } from '@bruny/core';
import { ToastComponent } from '@bruny/ui';

@Component({
  imports: [RouterLink, RouterOutlet, ToastComponent],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  readonly cart = inject(CartStore);
  readonly toast = inject(ToastService);
}
