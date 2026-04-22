import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { ApiPaginationResponse, ApiResponse } from "../types/api-response";
import { environment } from "../../environment";
import { map } from "rxjs";

export type Store = {
    id: string;
    name: string;
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
}