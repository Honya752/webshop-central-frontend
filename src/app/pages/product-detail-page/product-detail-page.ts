import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Card } from 'primeng/card';
import { ProductsService } from '../../services/product.service';
import { StoresService } from '../../services/stores.service';
import { ProductChannelMapping, ProductDetail } from '../../types/product';
import { StoreSummary } from '../../types/store';
import { CommonModule } from '@angular/common';
import { MessageService } from 'primeng/api';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { BarcodeComponent } from '../../components/barcode/barcode';

import { getApiErrorMessage } from '../../utils/api-error';
@Component({
  selector: 'app-product-detail-page',
  imports: [
    CommonModule,
    Card,
    ReactiveFormsModule,
    SelectModule,
    ButtonModule,
    TableModule,
    RouterLink,
    TagModule,
    BarcodeComponent,
  ],
  templateUrl: './product-detail-page.html',
  styleUrl: './product-detail-page.sass',
})
export class ProductDetailPage implements OnInit {

  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly productService = inject(ProductsService);
  private readonly storesService = inject(StoresService);
  private readonly messageService = inject(MessageService);

  id: string | null = null;
  isLoading = signal(false);
  product = signal<ProductDetail | null>(null);

  /** The product has no name of its own, only localized ones: show the first localization. */
  readonly productName = computed(() => this.product()?.localizations?.[0]?.name ?? this.product()?.sku ?? '');

  /** Sum of the stock of every wholesaler. */
  readonly totalStock = computed(() =>
    (this.product()?.stocks ?? []).reduce((sum, stock) => sum + stock.stock, 0)
  );
  stores = signal<StoreSummary[]>([]);

  webshopForm = this.fb.nonNullable.group({
    storeId: this.fb.nonNullable.control('', [Validators.required])
  })

  loadProduct(id: string) {
    this.isLoading.set(true);

    this.productService.getAllProductData(id).subscribe({
      next: (payload) => {
        this.product.set(payload);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: getApiErrorMessage(error, 'Failed to load product!'),
        });
        this.isLoading.set(false);
      }
    })
  }

  loadStoreSummaries() {
    this.storesService.getStoreSummaries().subscribe({
      next: (payload) => {
        this.stores.set(payload);
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: getApiErrorMessage(error, 'Failed to load stores!'),
        });
      }
    });
  }

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');

    if (!this.id)
      throw new Error('Missing Id');

    this.loadProduct(this.id);
    this.loadStoreSummaries();
  }

  addToWebshop() {
    if (this.webshopForm.invalid) {
      this.webshopForm.markAllAsTouched();
      return;
    }

    const storeId = this.webshopForm.controls.storeId.getRawValue();
    this.syncWithStore(storeId, this.id);
  }

  syncWithStore(storeId: string, productId: string | null) {
    if (!productId) return;

    this.storesService.syncProductToStore(storeId, productId).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Product synced',
          detail: 'Product synced to the store successfully',
        });
        if (this.id) this.loadProduct(this.id);
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: getApiErrorMessage(error, 'Failed to sync product to the store!'),
        })
      }
    })
  }

  storeOptions = computed(() =>
    this.stores().map(store => ({
      label: store.name,
      value: store.id,
    }))
  );

  isInSync(mapping: ProductChannelMapping): boolean {
    const updatedAt = this.product()?.updatedAt;
    const syncedAt = mapping.lastSyncedAt;

    if (!updatedAt || !syncedAt) return false;
    return new Date(syncedAt).getTime() >= new Date(updatedAt).getTime();
  }

  getFlagEmoji(region: string): string {
    return region
      .toUpperCase()
      .replace(/./g, char =>
        String.fromCodePoint(127397 + char.charCodeAt(0))
      );
  }
}
