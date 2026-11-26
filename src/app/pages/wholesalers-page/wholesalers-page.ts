import { Component, inject, OnInit, signal } from '@angular/core';
import { ExternalLink } from '../../components/external-link/external-link';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { Card } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { WholesalersService } from '../../services/wholesalers.service';
import { Wholesaler } from '../../types/wholesaler';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { getApiErrorMessage } from '../../utils/api-error';

@Component({
  selector: 'app-wholesalers-page',
  imports: [ExternalLink, Card, TableModule, ButtonModule, TagModule, RouterLink, ProgressSpinnerModule, ConfirmDialogModule],
  providers: [ConfirmationService],
  templateUrl: './wholesalers-page.html',
  styleUrl: './wholesalers-page.sass',
})
export class WholesalersPage implements OnInit {

  private readonly wholesalersService = inject(WholesalersService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);

  wholesalers = signal<Wholesaler[]>([]);
  isLoading = signal(false);
  /** ID of the wholesaler whose catalog is being synced. */
  syncingId = signal<string | null>(null);

  loadWholesaler() {
    if (this.isLoading()) return;
    this.isLoading.set(true);

    this.wholesalersService.listWholesalers().subscribe({
      next: (payload) => {
        this.wholesalers.set(payload);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: getApiErrorMessage(error, 'Failed to load wholesalers!'),
        });
        this.isLoading.set(false);
      }
    })
  }

  ngOnInit(): void {
    this.loadWholesaler();
  }

  syncWholesalerCatalog(id: string) {
    if (this.syncingId()) return;
    this.syncingId.set(id);

    this.wholesalersService.syncCatalog(id).subscribe({
      next: (result) => {
        this.syncingId.set(null);
        this.messageService.add({
          severity: result.failed.length ? 'warn' : 'success',
          summary: 'Wholesaler catalog updated',
          detail: `${result.total} products: ${result.created} created, ${result.updated} updated, `
            + `${result.zeroed} zeroed, ${result.failed.length} failed`,
        });
      },
      error: (error) => {
        this.syncingId.set(null);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: getApiErrorMessage(error, 'Failed to update wholesaler catalog!'),
        });
      }
    })
  }

  confirmDelete(event: Event, wholesaler: Wholesaler) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Are you sure you want to delete ${wholesaler.name}?`,
      header: 'Delete confirmation',
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
      accept: () => this.deleteWholesaler(wholesaler.id),
    });
  }

  private deleteWholesaler(id: string) {
    this.wholesalersService.deleteWholesaler(id).subscribe({
      next: () => {
        this.wholesalers.update(items => items.filter(item => item.id !== id));
        this.messageService.add({
          severity: 'success',
          summary: 'Deleted',
          detail: 'Wholesaler deleted successfully',
        });
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: getApiErrorMessage(error, 'Failed to delete wholesaler!'),
        });
      }
    });
  }
}
