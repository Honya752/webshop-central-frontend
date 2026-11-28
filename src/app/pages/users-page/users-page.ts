import { AfterViewInit, Component, computed, ElementRef, inject, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { UsersService } from '../../services/users.service';
import { User } from '../../types/user';
import { Card } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { RouterLink } from '@angular/router';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';

import { getApiErrorMessage } from '../../utils/api-error';
import { UserAvatar } from '../../components/user-avatar/user-avatar';
import { AuthService } from '../../services/auth.service';
import { GlobalRole, StoreRole } from '../../types/enums';
@Component({
  selector: 'app-users-page',
  imports: [UserAvatar, Card, TableModule, ButtonModule, TagModule, RouterLink, ProgressSpinnerModule,
    ConfirmDialogModule,
  ],
  templateUrl: './users-page.html',
  providers: [ConfirmationService],
  styleUrl: './users-page.sass',
})
export class UsersPage implements OnInit, AfterViewInit, OnDestroy {

  private readonly usersService = inject(UsersService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly authService = inject(AuthService);

  users = signal<User[]>([]);
  /** Number of all users (from the pagination meta). */
  readonly total = signal<number | null>(null);
  /** The logged in user cannot delete themselves from the list. */
  readonly currentUserId = computed(() => this.authService.currentUser()?.id ?? null);
  isLoading = signal(false);
  hasNextPage = signal(true);
  page = signal(1);
  limit = 25;

  private observer!: IntersectionObserver;

  @ViewChild('loadMoreTrigger', { static: true })
  loadMoreTrigger!: ElementRef;

  loadUsers() {
    if (this.isLoading() || !this.hasNextPage()) return;

    this.isLoading.set(true);

    this.usersService.getAllUsers({ page: this.page(), limit: this.limit }).subscribe({
      next: (payload) => {
        const { users, meta } = payload;

        this.users.update(prev => [...prev, ...users]);
        this.total.set(meta.total);
        this.hasNextPage.set(meta.pages > meta.page);
        this.page.set(meta.page + 1);

        this.isLoading.set(false);
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: getApiErrorMessage(error, 'Failed to load users!'),
        });
        this.hasNextPage.set(false);

        this.isLoading.set(false);
      }
    });
  }

  deleteUser(id: string) {
    this.isLoading.set(true);

    this.usersService.deleteUser(id).subscribe({
      next: () => {
        // Reset the flag first: loadUsers() does nothing while a request is running
        this.isLoading.set(false);
        this.resetAndReload();
        this.messageService.add({
          severity: 'success',
          summary: 'Deleted',
          detail: 'User deleted successfully',
        });
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: getApiErrorMessage(error, 'Failed to delete user!'),
        });

        this.isLoading.set(false);
      }
    })
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  ngAfterViewInit(): void {
    this.observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        this.loadUsers();
      }
    }, {
      rootMargin: '200px'
    });

    this.observer.observe(this.loadMoreTrigger.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  private readonly roles: Record<GlobalRole, string> = {
    SYSADMIN: 'Administrator',
    MODERATOR: 'Moderator',
    USER: 'User',
  };

  /** Different from the system roles, so "Administrator" always means the system administrator. */
  private readonly storeRoles: Record<StoreRole, string> = {
    ADMIN: 'Store admin',
    MODERATOR: 'Store moderator',
    VIEWER: 'Viewer',
  };

  roleLabel(role: GlobalRole): string {
    return this.roles[role] ?? role;
  }

  storeRoleLabel(role: StoreRole): string {
    return this.storeRoles[role] ?? role;
  }

  confirmDelete(event: Event, user: User) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Are you sure you want to delete ${user.name} (${user.email})? Their store membership is deleted too`,
      header: 'Delete user',
      icon: 'pi pi-exclamation-triangle', rejectButtonProps: {
        label: 'Cancel',
        severity: 'secondary',
        outlined: true,
      },
      acceptButtonProps: {
        label: 'Delete',
        severity: 'danger',
      },
      accept: () => {
        this.deleteUser(user.id);
      },
    });
  }

  resetAndReload(): void {
    this.users.set([]);
    this.page.set(1);
    this.hasNextPage.set(true);

    this.loadUsers();
  }

}
