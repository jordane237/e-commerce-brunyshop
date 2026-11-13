import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastService } from '@bruny/core';
import { ToastComponent } from '@bruny/ui';

@Component({
  imports: [RouterOutlet, ToastComponent],
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  readonly toast = inject(ToastService);
}
