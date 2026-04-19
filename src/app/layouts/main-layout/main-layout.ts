import { Component, inject } from '@angular/core';
import { Router, RouterOutlet, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Card } from 'primeng/card';
import { BadgeModule } from 'primeng/badge';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, RouterLink, Card, BadgeModule],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.sass',
})
export class MainLayout {
  authService = inject(AuthService);
  private router = inject(Router);

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }

  get user() {
    return this.authService.currentUser();
  }
}
