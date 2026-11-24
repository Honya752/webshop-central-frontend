import { Component, inject } from '@angular/core';
import { Router, RouterOutlet, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Card } from 'primeng/card';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, RouterLink, Card, BadgeModule, ButtonModule],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.sass',
})
export class MainLayout {
  authService = inject(AuthService);
  private router = inject(Router);
  private messageService = inject(MessageService);

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/login');
    this.messageService.add({ severity: 'info', summary: 'Logged out', detail: 'You have been logged out' });
  }

  get user() {
    return this.authService.currentUser();
  }
}
