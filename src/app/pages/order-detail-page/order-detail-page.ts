import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { OrderData, OrdersService } from '../../services/orders.service';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Card } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { BarcodeComponent } from '../../components/barcode/barcode';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-order-detail-page',
  imports: [CurrencyPipe, DatePipe, Card, TableModule, ButtonModule, TagModule, ProgressSpinnerModule, RouterLink, BarcodeComponent, ToastModule],
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
  readonly order = signal<OrderData | null>(null)

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');

    if (!this.id)
      throw new Error('Missing Id');

    this.loadOrder(this.id);
  }

  loadOrder(id: string) {
    this.ordersService.getOrderById(id).subscribe({
      next: payload => {
        console.log(payload);
        this.order.set(payload);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('Failed to load order');
        this.isLoading.set(false);
      }
    });
  }

  markOrderAs(status: string) {
    const id = this.order()?.id;
    if (!id) return;

    this.ordersService.setOrderStatus(id, status).subscribe({
      next: (status) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Order updated',
          detail: `Order status updated successfully`,
        });
        this.loadOrder(id);
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed update order status!',
        })
      }
    })
  }

}
