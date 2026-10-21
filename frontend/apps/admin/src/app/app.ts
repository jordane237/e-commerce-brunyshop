import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { SessionService } from '@bruny/data-access';
import { ToastComponent } from '@bruny/ui';
import { errorMessage } from './core/http';

@Component({
  imports: [RouterLink, RouterOutlet, ToastComponent],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  readonly session = inject(SessionService);
  readonly errorMessage = errorMessage;
  private readonly router = inject(Router);

  logout(): void {
    this.session.logout().subscribe({
      next: () => void this.router.navigateByUrl('/connexion'),
      error: () => {
        this.session.clear();
        void this.router.navigateByUrl('/connexion');
      },
    });
  }
}
