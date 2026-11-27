import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ExternalLink } from '../../components/external-link/external-link';
import { OrdersService } from '../../services/orders.service';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { Card } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { BarcodeComponent } from '../../components/barcode/barcode';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { AuthService } from '../../services/auth.service';
import { OrderDetail } from '../../types/order';
import { OrderItemIssue, OrderStatus } from '../../types/enums';
import { OrderStatusTag } from '../../components/order-status-tag/order-status-tag';
import { WholesalerOrderStatusTag } from '../../components/wholesaler-order-status-tag/wholesaler-order-status-tag';

import { getApiErrorMessage } from '../../utils/api-error';
import { MoneyPipe } from '../../pipes/money.pipe';

type StatusAction = {
  label: string;
  icon: string;
  severity: 'secondary' | 'warn' | 'info' | 'success' | 'danger' | 'contrast';
};

@Component({
  selector: 'app-order-detail-page',
  imports: [ExternalLink, MoneyPipe, DatePipe, Card, TableModule, ButtonModule, TagModule, ProgressSpinnerModule, BarcodeComponent, RouterLink, OrderStatusTag, WholesalerOrderStatusTag, ConfirmDialogModule],
  providers: [ConfirmationService],
  templateUrl: './order-detail-page.html',
  styleUrl: './order-detail-page.sass',
})
export class OrderDetailPage implements OnInit {

  private readonly route = inject(ActivatedRoute);
  private readonly ordersService = inject(OrdersService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  readonly authService = inject(AuthService);

  id: string | null = null;
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly order = signal<OrderDetail | null>(null);

  /** Changing the status needs store MODERATOR or higher (or SYSADMIN). */
  readonly canChangeStatus = computed(() =>
    this.authService.hasStoreRole(this.order()?.store.id, 'MODERATOR')
  );

  private readonly statusActions: Record<OrderStatus, StatusAction> = {
    PROCESSING: { label: 'Processing', icon: 'pi pi-spinner-dotted', severity: 'secondary' },
    ORDERED_FROM_WHOLESALER: { label: 'Ordered', icon: 'pi pi-box', severity: 'warn' },
    SHIPPING_TO_STORE: { label: 'Shipping', icon: 'pi pi-truck', severity: 'info' },
    COMPLETED: { label: 'Completed', icon: 'pi pi-check-circle', severity: 'success' },
    CANCELLED: { label: 'Cancelled', icon: 'pi pi-times-circle', severity: 'danger' },
    NEEDS_ATTENTION: { label: 'Needs attention', icon: 'pi pi-exclamation-triangle', severity: 'contrast' },
  };

  /** Buttons for the statuses the order can be changed to (from the backend's `nextStatuses`). */
  readonly nextStatusActions = computed(() =>
    (this.order()?.nextStatuses ?? []).map(status => ({ status, ...this.statusActions[status] }))
  );

  readonly isChangingStatus = signal(false);

  private readonly issueLabels: Record<OrderItemIssue, string> = {
    OUT_OF_STOCK: 'Out of stock',
    UNKNOWN_PRODUCT: 'Unknown product',
    WHOLESALER_REJECTED: 'Refused by the wholesaler',
  };

  issueLabel(issue: OrderItemIssue): string {
    return this.issueLabels[issue];
  }

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');

    if (!this.id)
      throw new Error('Missing Id');

    this.loadOrder(this.id);
  }

  loadOrder(id: string) {
    this.isLoading.set(true);
    this.error.set(null);

    this.ordersService.getOrderById(id).subscribe({
      next: payload => {
        this.order.set(payload);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.error.set(getApiErrorMessage(error, 'Failed to load order'));
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: getApiErrorMessage(error, 'Failed to load order!'),
        });
        this.isLoading.set(false);
      }
    });
  }

  confirmStatus(event: Event, status: OrderStatus) {
    // Cancelling gives the stock back to the wholesalers and cannot be undone
    if (status !== 'CANCELLED') {
      this.markOrderAs(status);
      return;
    }

    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'The order is closed and its stock is given back to the wholesalers. This cannot be undone. Are you sure?',
      header: 'Cancel order',
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: {
        label: 'Back',
        severity: 'secondary',
        outlined: true,
      },
      acceptButtonProps: {
        label: 'Cancel order',
        severity: 'danger',
      },
      accept: () => this.markOrderAs(status),
    });
  }

  markOrderAs(status: OrderStatus) {
    const id = this.order()?.id;
    if (!id || this.isChangingStatus()) return;

    this.isChangingStatus.set(true);

    this.ordersService.setOrderStatus(id, status).subscribe({
      next: () => {
        this.isChangingStatus.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Order updated',
          detail: 'Order status updated successfully',
        });
        this.loadOrder(id);
      },
      error: (error) => {
        this.isChangingStatus.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: getApiErrorMessage(error, 'Failed to update order status!'),
        });
        // e.g. 409: the status was changed meanwhile, show the current state
        this.loadOrder(id);
      }
    });
  }

}
