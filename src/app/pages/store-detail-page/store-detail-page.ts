import { Component, inject, OnInit, signal } from '@angular/core';
import { StoreData, StoresService } from '../../services/stores.service';
import { MessageService } from 'primeng/api';
import { ActivatedRoute, RouterLink, } from '@angular/router';
import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { Card } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-store-detail-page',
  imports: [CurrencyPipe, DatePipe, DecimalPipe, Card, TableModule, ButtonModule, TagModule, ProgressSpinnerModule, ToastModule, RouterLink],
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
  readonly store = signal<StoreData | null>(null)

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');

    if (!this.id)
      throw new Error('Missing Id');

    this.loadStore(this.id);
  }

  loadStore(id: string) {
    this.storesService.getStoreDetails(id).subscribe({
      next: payload => {
        console.log(payload);
        this.store.set(payload);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('Failed to load order');
        this.isLoading.set(false);
      }
    });
  }

  isInSync(product: any) {
    const updatedAt = product.data.updatedAt;
    const syncedAt: Date = product.mapping.lastSyncedAt

    if (updatedAt && syncedAt && syncedAt >= updatedAt) return true;
    return false;
  }

  syncWithStore(productId: string) {
    const storeId = this.store()?.id;
    if (!storeId) return;

    this.storesService.addProductToStore(storeId, productId).subscribe({
      next: (payload) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Product updated',
          detail: `Product added successfully`,
        });
        if (this.id) this.loadStore(storeId);
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to add product to store!',
        })
      }
    })
  }

}
