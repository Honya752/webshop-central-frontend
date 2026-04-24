import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Card } from 'primeng/card';
import { ProductDetail, ProductsService } from '../../services/product.service';
import { StoresService, StoreSummary } from '../../services/stores.service';
import { CommonModule } from '@angular/common';
import { MessageService } from 'primeng/api';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-product-detail-page',
  imports: [
    CommonModule,
    Card,
    ReactiveFormsModule,
    SelectModule,
    ButtonModule,
    ToastModule,
    TableModule,
    RouterLink,
    TagModule
  ],
  providers: [MessageService],
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
  stores = signal<StoreSummary[]>([]);

  webshopForm = this.fb.nonNullable.group({
    storeId: this.fb.nonNullable.control('', [Validators.required])
  })

  loadProduct(id: string) {
    this.isLoading.set(true);

    this.productService.getAllProductData(id).subscribe({
      next: (payload) => {
        console.log(payload)
        this.product.set(payload);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load product!',
        });
        this.isLoading.set(false);
      }
    })
  }

  loadStoreSummaries() {
    this.storesService.getStoreSummeries().subscribe({
      next: (payload) => {
        this.stores.set(payload);
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load stores!',
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
    const storeId = this.webshopForm.controls.storeId.getRawValue();
    this.syncWithStore(storeId, this.id);
  }

  syncWithStore(storeId: string, productId: string | null) {
    if (!productId) return;

    this.storesService.addProductToStore(storeId, productId).subscribe({
      next: (payload) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Product updated',
          detail: `Product added successfully`,
        });
        if (this.id) this.loadProduct(this.id);
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

  storeOptions = computed(() =>
    this.stores().map(store => ({
      label: store.name,
      value: store.id,
    }))
  );

  isInSync(map: any) {
    const updatedAt = this.product()?.updatedAt;
    const syncedAt: Date = map.lastSyncedAt;

    if (updatedAt && syncedAt && syncedAt >= updatedAt) return true;
    return false;
  }
}
