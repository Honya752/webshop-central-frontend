import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map } from 'rxjs';
import { environment } from '../../environment';
import { ApiPaginationResponse, ApiResponse } from '../types/api-response';
import { CatalogImportResult } from '../types/integration';
import { toHttpParams } from '../utils/http-params';
import {
    CreateWholesaler, UpdateWholesaler, Wholesaler, WholesalerCredentialsStatus, WholesalerDetail,
    WholesalerOrder, WholesalerOrderDetail, WholesalerOrderQuery,
} from '../types/wholesaler';

@Injectable({
    providedIn: 'root'
})
export class WholesalersService {
    private readonly http = inject(HttpClient);

    listWholesalers() {
        return this.http
            .get<ApiResponse<Wholesaler[]>>(`${environment.apiUrl}/wholesalers`)
            .pipe(map(response => response.data));
    }

    getWholesalerDetail(id: string) {
        return this.http
            .get<ApiResponse<WholesalerDetail>>(`${environment.apiUrl}/wholesalers/${id}`)
            .pipe(map(response => response.data));
    }

    createWholesaler(payload: CreateWholesaler) {
        return this.http
            .post<ApiResponse<Wholesaler>>(`${environment.apiUrl}/wholesalers`, payload)
            .pipe(map(response => response.data));
    }

    updateWholesaler(payload: UpdateWholesaler, id: string) {
        return this.http
            .patch<ApiResponse<Wholesaler>>(`${environment.apiUrl}/wholesalers/${id}`, payload)
            .pipe(map(response => response.data));
    }

    deleteWholesaler(id: string) {
        return this.http
            .delete<ApiResponse<Wholesaler>>(`${environment.apiUrl}/wholesalers/${id}`)
            .pipe(map(response => response.data));
    }

    listWholesalerOrders(query: WholesalerOrderQuery = {}) {
        return this.http.get<ApiPaginationResponse<WholesalerOrder>>(`${environment.apiUrl}/wholesaler-orders`, { params: toHttpParams(query) });
    }

    getWholesalerOrder(id: string) {
        return this.http
            .get<ApiResponse<WholesalerOrderDetail>>(`${environment.apiUrl}/wholesaler-orders/${id}`)
            .pipe(map(response => response.data));
    }

    sendWholesalerOrder(id: string) {
        return this.http
            .post<ApiResponse<WholesalerOrder>>(`${environment.apiUrl}/wholesaler-orders/${id}/send`, {})
            .pipe(map(response => response.data));
    }

    getCredentials(id: string) {
        return this.http
            .get<ApiResponse<WholesalerCredentialsStatus>>(`${environment.apiUrl}/wholesalers/${id}/credentials`)
            .pipe(map(response => response.data));
    }

    setCredentials(id: string, apiKey: string) {
        return this.http
            .put<ApiResponse<WholesalerCredentialsStatus>>(`${environment.apiUrl}/wholesalers/${id}/credentials`, { apiKey })
            .pipe(map(response => response.data));
    }

    deleteCredentials(id: string) {
        return this.http.delete<void>(`${environment.apiUrl}/wholesalers/${id}/credentials`);
    }

    syncCatalog(id: string) {
        return this.http
            .post<ApiResponse<CatalogImportResult>>(`${environment.apiUrl}/wholesalers/${id}/sync-catalog`, {})
            .pipe(map(response => response.data));
    }
}
