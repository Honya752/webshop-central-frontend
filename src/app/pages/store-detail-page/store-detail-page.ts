import { computed, Component, inject, OnInit, signal } from '@angular/core';
import { ExternalLink } from '../../components/external-link/external-link';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Card } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TabsModule } from 'primeng/tabs';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { StoresService } from '../../services/stores.service';
import { StoreDetail } from '../../types/store';
import { ProductWithChannelMapping } from '../../types/product';
import { OrderStatusTag } from '../../components/order-status-tag/order-status-tag';
import { StoreIntegrationCredentials } from '../../components/store-integration-credentials/store-integration-credentials';
import { StoreApiCredentials } from '../../components/store-api-credentials/store-api-credentials';
import { StoreJobs } from '../../components/store-jobs/store-jobs';
import { getApiErrorMessage } from '../../utils/api-error';

import { MoneyPipe } from '../../pipes/money.pipe';
import { AuthService } from '../../services/auth.service';
import { BadgeModule } from 'primeng/badge';
import { platformLabel } from '../../utils/labels';

type StoreTab = 'orders' | 'products' | 'jobs' | 'integration' | 'api-keys';

@Component({
  selector: 'app-store-detail-page',
  imports: [ExternalLink, MoneyPipe,
    DatePipe, RouterLink,
    Card, TableModule, ButtonModule, TagModule, TabsModule, ConfirmDialogModule, BadgeModule,
    OrderStatusTag, StoreIntegrationCredentials, StoreApiCredentials, StoreJobs,
  ],
  providers: [ConfirmationService],
  templateUrl: './store-detail-page.html',
  styleUrl: './store-detail-page.sass',
})
export class StoreDetailPage implements OnInit {

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly storesService = inject(StoresService);
  private readonly authService = inject(AuthService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);

  id: string | null = null;
  readonly isLoading = signal(false);
  readonly isSyncingAll = signal(false);
  readonly error = signal<string | null>(null);
  readonly store = signal<StoreDetail | null>(null);
  readonly activeTab = signal<StoreTab>('orders');
  /** Product whose single sync is running (spinner on its button). */
  readonly syncingProductId = signal<string | null>(null);

  readonly platformLabel = platformLabel;

  // Shown as badges on the tabs
  readonly needsAttentionCount = computed(() =>
    (this.store()?.orders ?? []).filter(order => order.status === 'NEEDS_ATTENTION').length
  );
  readonly outOfSyncCount = computed(() =>
    (this.store()?.products ?? []).filter(product => !this.isInSync(product)).length
  );
  readonly productsSummary = computed(() => {
    const uploaded = `${this.store()?.products?.length ?? 0} uploaded`;
    return this.outOfSyncCount() > 0 ? `${uploaded}, ${this.outOfSyncCount()} out of sync` : uploaded;
  });

  // Permissions of the current user on this store (mirror the backend guards)
  private readonly storeId = computed(() => this.store()?.id ?? this.id);
  readonly canEdit = computed(() => this.authService.hasStoreRole(this.storeId(), 'ADMIN'));
  readonly canManageKeys = computed(() => this.authService.hasStoreRole(this.storeId(), 'ADMIN'));
  readonly canSync = computed(() => this.authService.hasStoreRole(this.storeId(), 'MODERATOR'));
  readonly canDelete = computed(() => this.authService.isSysadmin());
  /** The product page needs the full product data, which is SYSADMIN only. */
  readonly canOpenProducts = computed(() => this.authService.isSysadmin());

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
      error: (error) => {
        this.error.set(getApiErrorMessage(error, 'Failed to load store'));
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: getApiErrorMessage(error, 'Failed to load store!'),
        });
        this.isLoading.set(false);
      }
    });
  }

  onTabChange(value: string | number | undefined) {
    if (value !== undefined) this.activeTab.set(value as StoreTab);
  }

  isInSync(product: ProductWithChannelMapping): boolean {
    const updatedAt = product.data.updatedAt;
    const syncedAt = product.mapping.lastSyncedAt;

    if (!updatedAt || !syncedAt) return false;
    return new Date(syncedAt).getTime() >= new Date(updatedAt).getTime();
  }

  syncWithStore(productId: string) {
    const storeId = this.store()?.id;
    if (!storeId || this.syncingProductId()) return;

    this.syncingProductId.set(productId);

    this.storesService.syncProductToStore(storeId, productId).subscribe({
      next: () => {
        this.syncingProductId.set(null);
        this.messageService.add({
          severity: 'success',
          summary: 'Product synced',
          detail: 'Product synced to the store successfully',
        });
        this.loadStore(storeId);
      },
      error: (error) => {
        this.syncingProductId.set(null);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: getApiErrorMessage(error, 'Failed to sync product to the store!'),
        });
      }
    });
  }

  syncAllProducts() {
    const storeId = this.store()?.id;
    if (!storeId || this.isSyncingAll()) return;

    this.isSyncingAll.set(true);

    this.storesService.syncAllProductsToStore(storeId).subscribe({
      next: (result) => {
        this.isSyncingAll.set(false);
        this.messageService.add({
          severity: result.failed.length ? 'warn' : 'success',
          summary: 'Products synced',
          detail: `${result.synced} of ${result.total} products synced, ${result.failed.length} failed`
            + (result.failed.length ? `: ${result.failed.map(f => f.sku).join(', ')}` : ''),
        });
        this.loadStore(storeId);
      },
      error: (error) => {
        this.isSyncingAll.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: getApiErrorMessage(error, 'Failed to sync the products to the store!'),
        });
      }
    });
  }

  confirmDelete(event: Event) {
    const store = this.store();
    if (!store) return;

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
      next: () => this.router.navigate(['/stores']),
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: getApiErrorMessage(error, 'Failed to delete the store!'),
        });
      }
    });
  }
}
