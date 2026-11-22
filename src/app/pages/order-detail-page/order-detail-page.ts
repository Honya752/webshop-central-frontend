import { Component, inject, OnInit, signal } from '@angular/core';
import { OrdersService } from '../../services/orders.service';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Card } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { BarcodeComponent } from '../../components/barcode/barcode';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { OrderDetail } from '../../types/order';
import { OrderItemIssue, OrderStatus } from '../../types/enums';
import { OrderStatusTag } from '../../components/order-status-tag/order-status-tag';

@Component({
  selector: 'app-order-detail-page',
  imports: [CurrencyPipe, DatePipe, Card, TableModule, ButtonModule, TagModule, ProgressSpinnerModule, BarcodeComponent, ToastModule, RouterLink, OrderStatusTag],
  providers: [MessageService],
  templateUrl: './order-detail-page.html',
  styleUrl: './order-detail-page.sass',
})
export class OrderDetailPage implements OnInit {

  private readonly route = inject(ActivatedRoute);
  private readonly ordersService = inject(OrdersService);
  private readonly messageService = inject(MessageService);

  id: string | null = null;
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly order = signal<OrderDetail | null>(null);

  private readonly issueLabels: Record<OrderItemIssue, string> = {
    OUT_OF_STOCK: 'Out of stock',
    UNKNOWN_PRODUCT: 'Unknown product',
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
      error: () => {
        this.error.set('Failed to load order');
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load order!',
        });
        this.isLoading.set(false);
      }
    });
  }

  markOrderAs(status: OrderStatus) {
    const id = this.order()?.id;
    if (!id) return;

    this.ordersService.setOrderStatus(id, status).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Order updated',
          detail: 'Order status updated successfully',
        });
        this.loadOrder(id);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to update order status!',
        });
      }
    });
  }

}
