import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.sass'
})
export class App {
  private authService = inject(AuthService);

  constructor() {
    if (this.authService.isAuthenticated()) {
      this.authService.loadCurrentUser().subscribe({
        error: () => {
          this.authService.logout();
        },
      });
    }
  }

  protected readonly title = signal('webshop-central-frontend');
}
