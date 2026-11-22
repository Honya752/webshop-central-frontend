import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map } from 'rxjs';
import { environment } from '../../environment';
import { ApiResponse } from '../types/api-response';
import { CatalogImportResult } from '../types/integration';
import { CreateWholesaler, UpdateWholesaler, Wholesaler, WholesalerDetail } from '../types/wholesaler';

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

    syncCatalog(id: string) {
        return this.http
            .post<ApiResponse<CatalogImportResult>>(`${environment.apiUrl}/wholesalers/${id}/sync-catalog`, {})
            .pipe(map(response => response.data));
    }
}
