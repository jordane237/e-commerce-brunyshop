import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService, SessionService, ToastService } from '@bruny/core';
import { ToastComponent } from '@bruny/ui';

@Component({
  imports: [RouterLink, RouterOutlet, ToastComponent],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  readonly session = inject(SessionService);
  readonly toast = inject(ToastService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  logout(): void {
    this.auth.logout().subscribe({
      next: () => void this.router.navigateByUrl('/connexion'),
      error: () => void this.router.navigateByUrl('/connexion'),
    });
  }
}
