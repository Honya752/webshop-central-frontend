import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet, RouterLink } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { Card } from 'primeng/card';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { StoreRole } from '../../types/enums';
import { UserAvatar } from '../../components/user-avatar/user-avatar';
import { Logo } from '../../components/logo/logo';
import { AuthService } from '../../services/auth.service';

/** Menu item that belongs to the current page. */
type MenuItem =
  | 'dashboard' | 'my-store'
  | 'products' | 'product-create'
  | 'orders'
  | 'stores' | 'store-create'
  | 'users' | 'user-create'
  | 'wholesalers' | 'wholesaler-create' | 'purchase-orders';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, RouterLink, Card, BadgeModule, ButtonModule, UserAvatar, Logo],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.sass',
})
export class MainLayout {
  authService = inject(AuthService);
  private router = inject(Router);
  private messageService = inject(MessageService);

  /** Current path without query string and fragment. */
  private readonly path = toSignal(
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => this.router.url),
      startWith(this.router.url),
      map(url => url.split(/[?#]/)[0]),
    ),
    { initialValue: '' },
  );

  /**
   * The highlighted menu item. Like routerLinkActive, but detail and edit pages light up their list too
   * (e.g. /product/123 → "All products").
   */
  readonly active = computed<MenuItem | null>(() => {
    const [section, id] = this.path().split('/').filter(Boolean);

    switch (section) {
      case 'dashboard': return 'dashboard';
      case 'products': return 'products';
      case 'product': return id === 'create' ? 'product-create' : 'products';
      case 'orders':
      case 'order': return 'orders';
      case 'stores': return 'stores';
      case 'store':
        if (id === 'create') return 'store-create';
        return id && id === this.ownStore()?.id ? 'my-store' : 'stores';
      case 'users': return 'users';
      case 'user': return id === 'create' ? 'user-create' : 'users';
      case 'wholesalers': return 'wholesalers';
      case 'wholesaler': return id === 'create' ? 'wholesaler-create' : 'wholesalers';
      case 'wholesaler-orders':
      case 'wholesaler-order': return 'purchase-orders';
      default: return null;
    }
  });

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
      ? `${global}, ${STORE_ROLE_LABELS[membership.role]} at ${membership.store.name}`
      : global;
  });
}

const STORE_ROLE_LABELS: Record<StoreRole, string> = {
  ADMIN: 'Store admin',
  MODERATOR: 'Store moderator',
  VIEWER: 'Viewer',
};
