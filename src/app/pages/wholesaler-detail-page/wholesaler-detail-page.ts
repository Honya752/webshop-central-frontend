import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ExternalLink } from '../../components/external-link/external-link';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { getApiErrorMessage } from '../../utils/api-error';
import { Card } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { WholesalersService } from '../../services/wholesalers.service';
import { WholesalerCredentialsStatus, WholesalerDetail } from '../../types/wholesaler';

import { MoneyPipe } from '../../pipes/money.pipe';
import { TabsModule } from 'primeng/tabs';
import { BadgeModule } from 'primeng/badge';
import { orderModeLabel, wholesalerIntegrationLabel } from '../../utils/labels';
@Component({
  selector: 'app-wholesaler-detail-page',
  imports: [ExternalLink, MoneyPipe, DatePipe, DecimalPipe, Card, TableModule, ButtonModule, TagModule, ConfirmDialogModule, RouterLink, FormsModule, InputTextModule, TabsModule, BadgeModule],
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
  readonly credentials = signal<WholesalerCredentialsStatus | null>(null);
  readonly isSavingKey = signal(false);
  readonly activeTab = signal<'stocks' | 'api-key'>('stocks');
  readonly orderModeLabel = orderModeLabel;
  readonly integrationLabel = wholesalerIntegrationLabel;
  apiKey = '';

  readonly totalStock = computed(() =>
    (this.wholesaler()?.stocks ?? []).reduce((sum, stock) => sum + stock.stock, 0)
  );

  readonly outOfStockCount = computed(() =>
    (this.wholesaler()?.stocks ?? []).filter(stock => stock.stock <= 0).length
  );


  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');

    if (!this.id)
      throw new Error('Missing Id');

    this.loadWholesaler(this.id);
    this.loadCredentials(this.id);
  }

  loadCredentials(id: string) {
    this.wholesalersService.getCredentials(id).subscribe({
      next: status => this.credentials.set(status),
      error: error => this.messageService.add({ severity: 'error', summary: 'Error', detail: getApiErrorMessage(error, 'Failed to load the API key status!') }),
    });
  }

  saveApiKey() {
    const id = this.id;
    if (!id || !this.apiKey.trim() || this.isSavingKey()) return;
    this.isSavingKey.set(true);

    this.wholesalersService.setCredentials(id, this.apiKey.trim()).subscribe({
      next: status => {
        this.credentials.set(status);
        this.apiKey = '';
        this.isSavingKey.set(false);
        this.messageService.add({ severity: 'success', summary: 'API key saved', detail: 'Purchase orders can be sent to this wholesaler' });
      },
      error: error => {
        this.isSavingKey.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: getApiErrorMessage(error, 'Failed to save the API key!') });
      },
    });
  }

  deleteApiKey() {
    const id = this.id;
    if (!id) return;

    this.wholesalersService.deleteCredentials(id).subscribe({
      next: () => {
        this.loadCredentials(id);
        this.messageService.add({ severity: 'info', summary: 'API key deleted', detail: 'Purchase orders to this wholesaler will fail until a new key is set' });
      },
      error: error => this.messageService.add({ severity: 'error', summary: 'Error', detail: getApiErrorMessage(error, 'Failed to delete the API key!') }),
    });
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
      message: `Are you sure you want to delete ${wholesaler.name}? Its product stocks and wholesaler orders are deleted too`,
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

}
