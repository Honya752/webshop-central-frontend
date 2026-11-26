import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { Card } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { WholesalerOrderStatusTag } from '../../components/wholesaler-order-status-tag/wholesaler-order-status-tag';
import { MoneyPipe } from '../../pipes/money.pipe';
import { WholesalersService } from '../../services/wholesalers.service';
import { WholesalerOrderDetail } from '../../types/wholesaler';
import { getApiErrorMessage } from '../../utils/api-error';

@Component({
  selector: 'app-wholesaler-order-detail-page',
  imports: [DatePipe, RouterLink, MoneyPipe, Card, ButtonModule, TableModule, WholesalerOrderStatusTag],
  templateUrl: './wholesaler-order-detail-page.html',
})
export class WholesalerOrderDetailPage implements OnInit {
  private readonly wholesalersService = inject(WholesalersService);
  private readonly messageService = inject(MessageService);
  private readonly route = inject(ActivatedRoute);

  readonly order = signal<WholesalerOrderDetail | null>(null);
  readonly isLoading = signal(false);
  readonly isSending = signal(false);

  ngOnInit(): void {
    this.load();
  }

  load() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.isLoading.set(true);
    this.wholesalersService.getWholesalerOrder(id).subscribe({
      next: order => {
        this.order.set(order);
        this.isLoading.set(false);
      },
      error: error => {
        this.isLoading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: getApiErrorMessage(error, 'Failed to load the purchase order!') });
      },
    });
  }

  canSend(): boolean {
    const status = this.order()?.status;
    return status === 'DRAFT' || status === 'SEND_FAILED';
  }

  send() {
    const order = this.order();
    if (!order || this.isSending()) return;
    this.isSending.set(true);

    this.wholesalersService.sendWholesalerOrder(order.id).subscribe({
      next: () => {
        this.isSending.set(false);
        this.messageService.add({ severity: 'info', summary: 'Sending', detail: `Purchase order to ${order.wholesaler.name} is being sent` });
        // sending runs in the background, the result is there in a moment
        setTimeout(() => this.load(), 2000);
      },
      error: error => {
        this.isSending.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: getApiErrorMessage(error, 'Failed to send the purchase order!') });
      },
    });
  }
}
