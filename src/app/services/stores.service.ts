import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { ApiPaginationResponse, ApiResponse } from "../types/api-response";
import { environment } from "../../environment";
import { map } from "rxjs";

export type Store = {
    id: string;
    name: string;
    slug: string;
    region: string;
    baseUrl: string;
    integrationType: string;
    integrationVer: string;
}

export type StoreSummary = {
    id: string;
    name: string;
    baseUrl: string;
}

export type CreateStore = {
    name: string;
    slug: string;
    region: string;
    baseUrl: string;
    integrationType: string;
    integrationVer: string;
}

export type UpdateStore = {
    name?: string;
    slug?: string;
    region?: string;
    baseUrl?: string;
    integrationType?: string;
    integrationVer?: string;
}

@Injectable({
    providedIn: 'root'
})
export class StoresService {
    private http = inject(HttpClient)

    getStores(page: number, limit: number) {
        return this.http
            .get<ApiPaginationResponse<Store>>(`${environment.apiUrl}/stores`, { params: { page, limit } })
            .pipe(map(response => {
                const { data: stores, meta } = response;
                return { stores, meta };
            }))
    }

    getStoreSummeries() {
        return this.http
            .get<ApiResponse<StoreSummary[]>>(`${environment.apiUrl}/stores/summary`)
            .pipe(map(response => {
                return response.data;
            }))
    }

    getStoreDetails(id: string) {
        return this.http
            .get<ApiResponse<Store>>(`${environment.apiUrl}/stores/${id}`)
            .pipe(map(response => response.data))
    }

    createStore(payload: CreateStore) {
        return this.http
            .post<ApiResponse<Store>>(`${environment.apiUrl}/stores`, payload)
            .pipe(map(response => response.data))
    }

    updateStore(payload: UpdateStore, id: string) {
        return this.http
            .patch<ApiResponse<Store>>(`${environment.apiUrl}/stores/${id}`, payload)
            .pipe(map(response => response.data))
    }

    deleteStore(id: string) {
        return this.http
            .delete<ApiResponse<Store>>(`${environment.apiUrl}/stores/${id}`)
            .pipe(map(response => response.data))
    }

    addProductToStore(storeId: string, productId: string) {
        return this.http
            .post(`${environment.apiUrl}/stores/${storeId}/product-sync/${productId}`, {})
            .pipe(map(response => response));
    }

}