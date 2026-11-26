import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { Card } from 'primeng/card';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { WholesalerOrderStatusTag } from '../../components/wholesaler-order-status-tag/wholesaler-order-status-tag';
import { MoneyPipe } from '../../pipes/money.pipe';
import { WholesalersService } from '../../services/wholesalers.service';
import { WholesalerOrderStatus } from '../../types/enums';
import { Wholesaler, WholesalerOrder } from '../../types/wholesaler';
import { getApiErrorMessage } from '../../utils/api-error';

@Component({
  selector: 'app-wholesaler-orders-page',
  imports: [DatePipe, FormsModule, RouterLink, MoneyPipe, Card, ButtonModule, SelectModule, TableModule, WholesalerOrderStatusTag],
  templateUrl: './wholesaler-orders-page.html',
})
export class WholesalerOrdersPage implements OnInit {
  private readonly wholesalersService = inject(WholesalersService);
  private readonly messageService = inject(MessageService);
  private readonly route = inject(ActivatedRoute);

  readonly orders = signal<WholesalerOrder[]>([]);
  readonly wholesalers = signal<Wholesaler[]>([]);
  readonly isLoading = signal(false);
  /** ID of the purchase order being sent. */
  readonly sendingId = signal<string | null>(null);

  status: WholesalerOrderStatus | null = null;
  wholesalerId: string | null = null;

  readonly statusOptions: { label: string; value: WholesalerOrderStatus }[] = [
    { label: 'Collecting', value: 'DRAFT' },
    { label: 'Sending', value: 'SENDING' },
    { label: 'Sent', value: 'SENT' },
    { label: 'Refused', value: 'REJECTED' },
    { label: 'Send failed', value: 'SEND_FAILED' },
    { label: 'Cancelled', value: 'CANCELLED' },
  ];

  ngOnInit(): void {
    // e.g. /wholesaler-orders?wholesalerId=... from the wholesaler page
    this.wholesalerId = this.route.snapshot.queryParamMap.get('wholesalerId');
    this.wholesalersService.listWholesalers().subscribe(list => this.wholesalers.set(list));
    this.load();
  }

  load() {
    this.isLoading.set(true);
    this.wholesalersService.listWholesalerOrders({
      limit: 100,
      status: this.status ?? undefined,
      wholesalerId: this.wholesalerId ?? undefined,
    }).subscribe({
      next: response => {
        this.orders.set(response.data);
        this.isLoading.set(false);
      },
      error: error => {
        this.isLoading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: getApiErrorMessage(error, 'Failed to load the purchase orders!') });
      },
    });
  }

  canSend(order: WholesalerOrder): boolean {
    return order.status === 'DRAFT' || order.status === 'SEND_FAILED';
  }

  send(order: WholesalerOrder) {
    if (this.sendingId()) return;
    this.sendingId.set(order.id);

    this.wholesalersService.sendWholesalerOrder(order.id).subscribe({
      next: () => {
        this.sendingId.set(null);
        this.messageService.add({ severity: 'info', summary: 'Sending', detail: `Purchase order to ${order.wholesaler.name} is being sent` });
        // sending runs in the background, the result is there in a moment
        setTimeout(() => this.load(), 2000);
      },
      error: error => {
        this.sendingId.set(null);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: getApiErrorMessage(error, 'Failed to send the purchase order!') });
      },
    });
  }
}
