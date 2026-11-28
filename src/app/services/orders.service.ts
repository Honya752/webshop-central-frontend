import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map } from 'rxjs';
import { environment } from '../../environment';
import { ApiPaginationResponse, ApiResponse } from '../types/api-response';
import { OrderStatus } from '../types/enums';
import { Order, OrderDetail, OrderFilterQuery, OrderStatusResponse } from '../types/order';
import { toHttpParams } from '../utils/http-params';

@Injectable({
    providedIn: 'root'
})
export class OrdersService {
    private readonly http = inject(HttpClient);

    getAllOrders(query: OrderFilterQuery) {
        return this.http
            .get<ApiPaginationResponse<Order>>(`${environment.apiUrl}/orders`, { params: toHttpParams(query) })
            .pipe(map(({ data: orders, meta }) => ({ orders, meta })));
    }

    getOrderById(id: string) {
        return this.http
            .get<ApiResponse<OrderDetail>>(`${environment.apiUrl}/orders/${id}`)
            .pipe(map(response => response.data));
    }

    setOrderStatus(id: string, status: OrderStatus) {
        return this.http
            .post<ApiResponse<OrderStatusResponse>>(`${environment.apiUrl}/orders/${id}/status`, { status })
            .pipe(map(response => response.data.status));
    }
}
