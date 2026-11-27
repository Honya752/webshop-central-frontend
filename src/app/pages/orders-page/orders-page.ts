import { AfterViewInit, Component, ElementRef, inject, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { OrderStatus } from '../../types/enums';
import { ExternalLink } from '../../components/external-link/external-link';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { Card } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { OrdersService } from '../../services/orders.service';
import { Order, OrderSortBy } from '../../types/order';
import { SortOrder } from '../../types/api-response';
import { OrderStatusTag } from '../../components/order-status-tag/order-status-tag';
import { debounceTime } from 'rxjs';
import { DatePipe } from '@angular/common';
import { RouterLink } from "@angular/router";


type OrderFilterForm = FormGroup<{
  search: FormControl<string>;
  status: FormControl<OrderStatus | null>;
  sortBy: FormControl<OrderSortBy>;
  sortOrder: FormControl<SortOrder>;
}>

import { getApiErrorMessage } from '../../utils/api-error';
import { MessageService } from 'primeng/api';
import { MoneyPipe } from '../../pipes/money.pipe';
@Component({
  selector: 'app-orders-page',
  imports: [ExternalLink, MoneyPipe, DatePipe, Card, TableModule, ButtonModule, TagModule, ProgressSpinnerModule, IconFieldModule, InputIconModule, ReactiveFormsModule, SelectModule, InputTextModule, RouterLink, OrderStatusTag],
  templateUrl: './orders-page.html',
  styleUrl: './orders-page.sass',
})
export class OrdersPage implements OnInit, AfterViewInit, OnDestroy {

  private fb = inject(FormBuilder);
  private ordersService = inject(OrdersService);
  private readonly messageService = inject(MessageService);

  orders = signal<Order[]>([]);
  /** Number of all matching orders (from the pagination meta). */
  readonly total = signal<number | null>(null);
  /** The running page request, cancelled when the filters change. */
  private loadSubscription?: Subscription;

  page = signal(1);
  limit = 30;

  isLoading = signal(false);
  hasNextPage = signal(true);

  filterForm: OrderFilterForm = this.fb.group({
    search: this.fb.nonNullable.control(''),
    status: this.fb.control<OrderStatus | null>(null),
    sortBy: this.fb.nonNullable.control<OrderSortBy>('createdAt'),
    sortOrder: this.fb.nonNullable.control<SortOrder>('desc')
  })

  private observer!: IntersectionObserver;

  @ViewChild('loadMoreTrigger', { static: true })
  loadMoreTrigger!: ElementRef;

  loadOrders() {
    if (this.isLoading() || !this.hasNextPage()) return;

    this.isLoading.set(true);

    const filters = this.filterForm.getRawValue();
    const param = {
      page: this.page(),
      limit: this.limit,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.search.trim() ? { search: filters.search.trim() } : {}),
    };

    this.loadSubscription = this.ordersService.getAllOrders(param).subscribe({
      next: (payload) => {
        const { orders, meta } = payload;

        this.orders.update(prev => [...prev, ...orders]);
        this.total.set(meta.total);
        this.hasNextPage.set(meta.pages > meta.page);
        this.page.set(meta.page + 1);

        this.isLoading.set(false);
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: getApiErrorMessage(error, 'Failed to load orders!'),
        });
        this.hasNextPage.set(false);
        this.isLoading.set(false);
      }
    })
  }

  resetAndReload(): void {
    // A request with the old filters must not add its rows to the new list
    this.loadSubscription?.unsubscribe();
    this.isLoading.set(false);

    this.orders.set([]);
    this.page.set(1);
    this.hasNextPage.set(true);

    this.loadOrders();
  }

  ngOnInit(): void {
    this.filterForm.valueChanges
      .pipe(debounceTime(300))
      .subscribe(() => this.resetAndReload());
    this.loadOrders();
  }

  ngAfterViewInit(): void {
    this.observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        this.loadOrders();
      }
    }, {
      rootMargin: '200px'
    });

    this.observer.observe(this.loadMoreTrigger.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.loadSubscription?.unsubscribe();
  }

  hasFilter(): boolean {
    const { search, status } = this.filterForm.getRawValue();
    return !!search.trim() || !!status;
  }

  readonly statusOptions: { label: string; value: OrderStatus }[] = [
    { label: 'Needs attention', value: 'NEEDS_ATTENTION' },
    { label: 'Processing', value: 'PROCESSING' },
    { label: 'Ordered', value: 'ORDERED_FROM_WHOLESALER' },
    { label: 'Shipping', value: 'SHIPPING_TO_STORE' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'Cancelled', value: 'CANCELLED' },
  ];

  sortByOptions: { label: string; value: OrderSortBy }[] = [
    { label: 'Date', value: 'createdAt' },
    { label: 'Total', value: 'total' },
    { label: 'Status', value: 'status' },
  ];

  sortOrderOptions: { label: string; value: SortOrder }[] = [
    { label: 'Descending', value: 'desc' },
    { label: 'Ascending', value: 'asc' },
  ];

}
