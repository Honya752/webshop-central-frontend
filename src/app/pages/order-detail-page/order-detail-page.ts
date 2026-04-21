import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { Order, OrdersService } from '../../services/orders.service';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Card } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
  selector: 'app-order-detail-page',
  imports: [CurrencyPipe, DatePipe, Card, TableModule, ButtonModule, TagModule, ProgressSpinnerModule, RouterLink],
  templateUrl: './order-detail-page.html',
  styleUrl: './order-detail-page.sass',
})
export class OrderDetailPage implements OnInit {

  private readonly route = inject(ActivatedRoute);
  private readonly ordersService = inject(OrdersService);
  private readonly destroyRef = inject(DestroyRef);

  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly order = signal<Order | null>(null)

  ngOnInit(): void {
    this.route.paramMap.pipe(
      switchMap(params => {
        const id = params.get('id');

        if (!id) {
          throw new Error('Missing order id');
        }

        this.isLoading.set(true);
        this.error.set(null);
        return this.ordersService.getOrderById(id);
      }),
    ).subscribe({
      next: payload => {
        this.order.set(payload);
        console.log(payload);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('Failed to load order');
        this.isLoading.set(false);
      }
    });
  }

}
