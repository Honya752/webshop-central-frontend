import { Component, computed, inject } from '@angular/core';
import { StoreRole } from '../../types/enums';
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

  /** The store of a store member; a SYSADMIN reaches every store from "All stores". */
  readonly ownStore = computed(() => this.authService.isSysadmin() ? null : this.authService.membership()?.store ?? null);

  readonly roleLabel = computed(() => {
    const user = this.authService.currentUser();
    if (!user) return '';
    if (user.globalRole === 'SYSADMIN') return 'Administrator';

    const membership = user.storeMembership;
    const global = user.globalRole === 'MODERATOR' ? 'Moderator' : 'User';
    return membership
      ? `${global} · ${STORE_ROLE_LABELS[membership.role]} of ${membership.store.name}`
      : global;
  });
}

const STORE_ROLE_LABELS: Record<StoreRole, string> = {
  ADMIN: 'Admin',
  MODERATOR: 'Moderator',
  VIEWER: 'Viewer',
};
