import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastModule],
  templateUrl: './app.html',
  styleUrl: './app.sass'
})
export class App {
  private authService = inject(AuthService);

  constructor() {
    // Loads the profile after a page reload; logs out if the token is no longer valid
    this.authService.ensureCurrentUser().subscribe();
  }

  protected readonly title = signal('webshop-central-frontend');
}
