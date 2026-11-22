import { Component, inject, OnInit, signal } from '@angular/core';
import { StoresService } from '../../services/stores.service';
import { MessageService } from 'primeng/api';
import { ActivatedRoute, RouterLink, } from '@angular/router';
import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { Card } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { StoreDetail } from '../../types/store';
import { ProductWithChannelMapping } from '../../types/product';
import { OrderStatusTag } from '../../components/order-status-tag/order-status-tag';

@Component({
  selector: 'app-store-detail-page',
  imports: [CurrencyPipe, DatePipe, DecimalPipe, Card, TableModule, ButtonModule, TagModule, ProgressSpinnerModule, ToastModule, RouterLink, OrderStatusTag],
  providers: [MessageService],
  templateUrl: './store-detail-page.html',
  styleUrl: './store-detail-page.sass',
})
export class StoreDetailPage implements OnInit {

  private readonly route = inject(ActivatedRoute);
  private readonly storesService = inject(StoresService);
  private readonly messageService = inject(MessageService);

  id: string | null = null;
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly store = signal<StoreDetail | null>(null);

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');

    if (!this.id)
      throw new Error('Missing Id');

    this.loadStore(this.id);
  }

  loadStore(id: string) {
    this.isLoading.set(true);
    this.error.set(null);

    this.storesService.getStoreDetails(id).subscribe({
      next: payload => {
        this.store.set(payload);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('Failed to load store');
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load store!',
        });
        this.isLoading.set(false);
      }
    });
  }

  isInSync(product: ProductWithChannelMapping): boolean {
    const updatedAt = product.data.updatedAt;
    const syncedAt = product.mapping.lastSyncedAt;

    if (!updatedAt || !syncedAt) return false;
    return new Date(syncedAt).getTime() >= new Date(updatedAt).getTime();
  }

  syncWithStore(productId: string) {
    const storeId = this.store()?.id;
    if (!storeId) return;

    this.storesService.syncProductToStore(storeId, productId).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Product synced',
          detail: 'Product synced to the store successfully',
        });
        this.loadStore(storeId);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to sync product to the store!',
        });
      }
    });
  }

}
