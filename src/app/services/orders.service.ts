import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../environment";
import { ApiPaginationResponse } from "../types/api-response";
import { map } from "rxjs";

type OrderStore = {
    id: string;
    name: string;
    baseUrl: string;
};

type OrederItem = {
    id: string;
    sku: string;
    quantity: string;
    unitPrice: number;
    total: number;
};

export type Order = {
    id: string;
    status: string;
    currency: string;
    total: number;
    paymentMethod: string;
    createdAtExternal: Date;
    createdAt: Date;
    updatedAt: Date;
    store: OrderStore;
    orderItems: OrederItem[];
}

type OrderFilterParam = {
    page: number,
    limit: number,
    sortBy: string,
    sortOrder: string
}

@Injectable({
    providedIn: 'root'
})
export class OrdersService {
    private http = inject(HttpClient)

    getAllOrders(param: OrderFilterParam) {
        return this.http
            .get<ApiPaginationResponse<Order>>(`${environment.apiUrl}/orders`, { params: param })
            .pipe(map((response) => {
                const { data: orders, meta } = response;
                console.log(response);
                return { orders, meta };
            }))
    }
}