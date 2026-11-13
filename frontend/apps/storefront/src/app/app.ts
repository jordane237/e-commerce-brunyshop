import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { ToastService } from '@bruny/core';
import { ToastComponent } from '@bruny/ui';
import { MiniCartComponent } from './layout/components/mini-cart/mini-cart.component';

@Component({
  imports: [RouterLink, RouterOutlet, ToastComponent, MiniCartComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  readonly toast = inject(ToastService);
}
