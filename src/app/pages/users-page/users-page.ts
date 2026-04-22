import { AfterViewInit, Component, ElementRef, inject, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { User, UsersService } from '../../services/users.service';
import { Card } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { RouterLink } from '@angular/router';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { MessageService, ConfirmationService } from 'primeng/api';

@Component({
  selector: 'app-users-page',
  imports: [Card, TableModule, ButtonModule, TagModule, RouterLink, ProgressSpinnerModule,
    ConfirmDialogModule, ToastModule,
  ],
  templateUrl: './users-page.html',
  providers: [MessageService, ConfirmationService],
  styleUrl: './users-page.sass',
})
export class UsersPage implements OnInit, AfterViewInit, OnDestroy {

  private readonly usersService = inject(UsersService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);

  users = signal<User[]>([]);
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

    this.usersService.getAllUsers(this.page(), this.limit).subscribe({
      next: (payload) => {
        const { users, meta } = payload;

        this.users.update(prev => [...prev, ...users]);
        this.hasNextPage.set(meta.pages > meta.page);
        this.page.set(meta.page);

        this.isLoading.set(false);
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load users',
        });

        this.isLoading.set(false);
      }
    });
  }

  deleteUser(id: string) {
    this.isLoading.set(true);

    this.usersService.deleteUser(id).subscribe({
      next: () => {
        this.resetAndReload();
        this.messageService.add({
          severity: 'success',
          summary: 'Deleted',
          detail: 'User deleted successfully',
        });

        this.isLoading.set(false);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to delete user',
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

  roles: Record<string, string> = {
    SYSADMIN: 'Administrator',
    MODERATOR: 'Moderator',
    USER: 'User',
  }

  storeRoles: Record<string, string> = {
    ADMIN: 'Administrator',
    MODERATOR: 'Moderator',
    VIEWER: 'Viewer'
  }

  confirmDelete(event: Event, userId: string) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Are you sure you want to delete this user?',
      header: 'Delete confirmation',
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
        this.deleteUser(userId);
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
