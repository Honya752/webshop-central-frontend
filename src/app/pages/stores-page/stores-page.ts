import { AfterViewInit, Component, ElementRef, inject, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { StoresService } from '../../services/stores.service';
import { Store } from '../../types/store';
import { Card } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { RouterLink } from '@angular/router';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { getApiErrorMessage } from '../../utils/api-error';
import { ExternalLink } from '../../components/external-link/external-link';
import { platformLabel } from '../../utils/labels';

@Component({
  selector: 'app-stores-page',
  imports: [Card, TableModule, ButtonModule, TagModule, RouterLink, ProgressSpinnerModule, ConfirmDialogModule, ExternalLink],
  providers: [ConfirmationService],
  templateUrl: './stores-page.html',
  styleUrl: './stores-page.sass',
})
export class StoresPage implements OnInit, AfterViewInit, OnDestroy {

  private readonly storesService = inject(StoresService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);

  stores = signal<Store[]>([]);
  /** Number of all stores (from the pagination meta). */
  readonly total = signal<number | null>(null);
  isLoading = signal(false);
  hasNextPage = signal(true);
  page = signal(1);
  limit = 25;

  private observer!: IntersectionObserver;

  @ViewChild('loadMoreTrigger', { static: true })
  loadMoreTrigger!: ElementRef;

  loadStores() {
    if (this.isLoading() || !this.hasNextPage()) return;

    this.isLoading.set(true);

    this.storesService.getStores({ page: this.page(), limit: this.limit }).subscribe({
      next: (payload) => {

        const { stores, meta } = payload;
        this.stores.update(prev => [...prev, ...stores]);
        this.total.set(meta.total);
        this.hasNextPage.set(meta.pages > meta.page);
        this.page.update(p => p + 1);

        this.isLoading.set(false);
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: getApiErrorMessage(error, 'Failed to load stores!'),
        });
        this.hasNextPage.set(false);
        this.isLoading.set(false);
      },
    })
  }

  ngOnInit(): void {
    this.loadStores();
  }

  ngAfterViewInit(): void {
    this.observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        this.loadStores();
      }
    }, {
      rootMargin: '200px'
    });

    this.observer.observe(this.loadMoreTrigger.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  readonly platformLabel = platformLabel;

  confirmDelete(event: Event, store: Store) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Are you sure you want to delete ${store.name}? Its API keys, product mappings and memberships are deleted too`,
      header: 'Delete store',
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: {
        label: 'Cancel',
        severity: 'secondary',
        outlined: true,
      },
      acceptButtonProps: {
        label: 'Delete',
        severity: 'danger',
      },
      accept: () => this.deleteStore(store.id),
    });
  }

  private deleteStore(id: string) {
    this.storesService.deleteStore(id).subscribe({
      next: () => {
        this.stores.update(items => items.filter(item => item.id !== id));
        this.total.update(total => total === null ? null : total - 1);
        this.messageService.add({
          severity: 'success',
          summary: 'Deleted',
          detail: 'Store deleted successfully',
        });
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: getApiErrorMessage(error, 'Failed to delete store!'),
        });
      }
    });
  }
}
