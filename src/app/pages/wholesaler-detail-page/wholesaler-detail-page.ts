import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ExternalLink } from '../../components/external-link/external-link';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { getApiErrorMessage } from '../../utils/api-error';
import { Card } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { WholesalersService } from '../../services/wholesalers.service';
import { WholesalerDetail } from '../../types/wholesaler';
import { WholesalerIntegrationType } from '../../types/enums';

import { MoneyPipe } from '../../pipes/money.pipe';
@Component({
  selector: 'app-wholesaler-detail-page',
  imports: [ExternalLink, MoneyPipe, DatePipe, DecimalPipe, Card, TableModule, ButtonModule, TagModule, ConfirmDialogModule, RouterLink],
  providers: [ConfirmationService],
  templateUrl: './wholesaler-detail-page.html',
  styleUrl: './wholesaler-detail-page.sass',
})
export class WholesalerDetailPage implements OnInit {

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly wholesalersService = inject(WholesalersService);
  private readonly messageService = inject(MessageService);

  id: string | null = null;
  readonly isLoading = signal(false);
  readonly isSyncing = signal(false);
  readonly error = signal<string | null>(null);
  readonly wholesaler = signal<WholesalerDetail | null>(null);

  readonly totalStock = computed(() =>
    (this.wholesaler()?.stocks ?? []).reduce((sum, stock) => sum + stock.stock, 0)
  );

  readonly outOfStockCount = computed(() =>
    (this.wholesaler()?.stocks ?? []).filter(stock => stock.stock <= 0).length
  );

  private readonly integrationLabels: Record<WholesalerIntegrationType, string> = {
    EXAMPLEWHOLESALER: 'Example wholesaler',
    JSON_INTEGRATION: 'JSON integration',
    XML_INTEGRATION: 'XML integration',
  };

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');

    if (!this.id)
      throw new Error('Missing Id');

    this.loadWholesaler(this.id);
  }

  loadWholesaler(id: string) {
    this.isLoading.set(true);
    this.error.set(null);

    this.wholesalersService.getWholesalerDetail(id).subscribe({
      next: payload => {
        this.wholesaler.set(payload);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.error.set(getApiErrorMessage(error, 'Failed to load wholesaler'));
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: getApiErrorMessage(error, 'Failed to load wholesaler!'),
        });
        this.isLoading.set(false);
      }
    });
  }

  syncCatalog() {
    const id = this.wholesaler()?.id;
    if (!id || this.isSyncing()) return;

    this.isSyncing.set(true);

    this.wholesalersService.syncCatalog(id).subscribe({
      next: (result) => {
        this.isSyncing.set(false);
        this.messageService.add({
          severity: result.failed.length ? 'warn' : 'success',
          summary: 'Wholesaler catalog updated',
          detail: `${result.total} products: ${result.created} created, ${result.updated} updated, `
            + `${result.zeroed} zeroed, ${result.failed.length} failed`,
        });
        this.loadWholesaler(id);
      },
      error: (error) => {
        this.isSyncing.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: getApiErrorMessage(error, 'Failed to update wholesaler catalog!'),
        });
      }
    });
  }

  confirmDelete(event: Event) {
    const wholesaler = this.wholesaler();
    if (!wholesaler) return;

    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Are you sure you want to delete ${wholesaler.name}? Its product stocks and wholesaler orders are deleted too.`,
      header: 'Delete wholesaler',
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
      next: () => this.router.navigate(['/wholesalers']),
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: getApiErrorMessage(error, 'Failed to delete the wholesaler!'),
        });
      }
    });
  }

  integrationLabel(type: WholesalerIntegrationType | undefined): string {
    return type ? this.integrationLabels[type] : '';
  }
}
