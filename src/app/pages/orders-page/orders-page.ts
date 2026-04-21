import { AfterViewInit, Component, ElementRef, inject, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { Card } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { Order, OrdersService } from '../../services/orders.service';
import { AuthService } from '../../services/auth.service';
import { debounceTime } from 'rxjs';
import { DatePipe } from '@angular/common';
import { CurrencyPipe } from '@angular/common';


type OrderFilterForm = FormGroup<{
  sortBy: FormControl<'createdAt' | 'total' | 'status'>;
  sortOrder: FormControl<'asc' | 'desc'>;
}>

@Component({
  selector: 'app-orders-page',
  imports: [CurrencyPipe, DatePipe, Card, TableModule, ButtonModule, TagModule, ProgressSpinnerModule, InputGroupModule, ReactiveFormsModule, SelectModule, InputTextModule],
  templateUrl: './orders-page.html',
  styleUrl: './orders-page.sass',
})
export class OrdersPage implements OnInit, AfterViewInit, OnDestroy {

  private fb = inject(FormBuilder);
  private ordersService = inject(OrdersService);
  private authService = inject(AuthService);

  orders = signal<Order[]>([]);

  page = signal(1);
  limit = 30;

  isLoading = signal(false);
  hasNextPage = signal(true);

  filterForm: OrderFilterForm = this.fb.group({
    sortBy: this.fb.nonNullable.control<'createdAt' | 'total' | 'status'>('createdAt'),
    sortOrder: this.fb.nonNullable.control<'asc' | 'desc'>('desc')
  })

  private observer!: IntersectionObserver;

  @ViewChild('loadMoreTrigger', { static: true })
  loadMoreTrigger!: ElementRef;

  loadOrders() {
    if (this.isLoading() || !this.hasNextPage()) return;

    this.isLoading.set(true);

    const param = {
      page: this.page(),
      limit: this.limit,
      sortBy: this.filterForm.controls.sortBy.getRawValue(),
      sortOrder: this.filterForm.controls.sortOrder.getRawValue()
    }

    this.ordersService.getAllOrders(param).subscribe({
      next: (payload) => {
        const { orders, meta } = payload;

        this.orders.update(prev => [...prev, ...orders]);
        this.hasNextPage.set(meta.pages > meta.page);
        this.page.set(meta.page);

        this.isLoading.set(false);
      },
      error: (error) => {
        this.isLoading.set(false);
      }
    })
  }

  resetAndReload(): void {
    this.orders.set([]);
    this.page.set(1);
    this.hasNextPage.set(true);

    this.loadOrders();
  }

  ngOnInit(): void {
    this.filterForm.valueChanges
      .pipe(debounceTime(300))
      .subscribe(values => {
        this.resetAndReload()
      });
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
  }

  get Role() {
    return this.authService.currentUser()?.globalRole;
  }

  sortByOptions = [
    { label: 'Status', value: 'status' },
    { label: 'Total price', value: 'total' },
    { label: 'Creation Date', value: 'createdAt' }
  ];

  sortOrderOptions = [
    { label: 'Ascending', value: 'asc' },
    { label: 'Descending', value: 'desc' }
  ];

}
