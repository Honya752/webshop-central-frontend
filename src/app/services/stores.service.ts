import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map } from 'rxjs';
import { environment } from '../../environment';
import { ApiPaginationResponse, ApiResponse, PaginationQuery } from '../types/api-response';
import {
    ChannelMapping,
    IntegrationJob,
    JobListQuery,
    SetStoreCredentials,
    StoreCredentialsSetResult,
    StoreCredentialsStatus,
    SyncAllResult,
} from '../types/integration';
import {
    CreatedStoreApiCredential,
    CreateStore,
    CreateStoreApiCredential,
    Store,
    StoreApiCredential,
    StoreDetail,
    StoreSummary,
    UpdateStore,
} from '../types/store';
import { toHttpParams } from '../utils/http-params';

@Injectable({
    providedIn: 'root'
})
export class StoresService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${environment.apiUrl}/stores`;

    // Stores

    getStores(query: PaginationQuery) {
        return this.http
            .get<ApiPaginationResponse<Store>>(this.baseUrl, { params: toHttpParams(query) })
            .pipe(map(({ data: stores, meta }) => ({ stores, meta })));
    }

    getStoreSummaries() {
        return this.http
            .get<ApiResponse<StoreSummary[]>>(`${this.baseUrl}/summary`)
            .pipe(map(response => response.data));
    }

    getStoreDetails(id: string) {
        return this.http
            .get<ApiResponse<StoreDetail>>(`${this.baseUrl}/${id}`)
            .pipe(map(response => response.data));
    }

    createStore(payload: CreateStore) {
        return this.http
            .post<ApiResponse<Store>>(this.baseUrl, payload)
            .pipe(map(response => response.data));
    }

    updateStore(payload: UpdateStore, id: string) {
        return this.http
            .patch<ApiResponse<Store>>(`${this.baseUrl}/${id}`, payload)
            .pipe(map(response => response.data));
    }

    deleteStore(id: string) {
        return this.http
            .delete<ApiResponse<Store>>(`${this.baseUrl}/${id}`)
            .pipe(map(response => response.data));
    }

    // Product sync

    syncProductToStore(storeId: string, productId: string) {
        return this.http
            .post<ApiResponse<ChannelMapping>>(`${this.baseUrl}/${storeId}/product-sync/${productId}`, {})
            .pipe(map(response => response.data));
    }

    syncAllProductsToStore(storeId: string) {
        return this.http
            .post<ApiResponse<SyncAllResult>>(`${this.baseUrl}/${storeId}/product-sync-all`, {})
            .pipe(map(response => response.data));
    }

    // Integration credentials (used by this system to call the webshop)

    getIntegrationCredentials(storeId: string) {
        return this.http
            .get<ApiResponse<StoreCredentialsStatus>>(`${this.baseUrl}/${storeId}/integration-credentials`)
            .pipe(map(response => response.data));
    }

    setIntegrationCredentials(storeId: string, payload: SetStoreCredentials) {
        return this.http
            .put<ApiResponse<StoreCredentialsSetResult>>(`${this.baseUrl}/${storeId}/integration-credentials`, payload)
            .pipe(map(response => response.data));
    }

    deleteIntegrationCredentials(storeId: string) {
        return this.http.delete<void>(`${this.baseUrl}/${storeId}/integration-credentials`);
    }

    // API credentials (used by the webshop to call this system)

    getApiCredentials(storeId: string) {
        return this.http
            .get<ApiResponse<StoreApiCredential[]>>(`${this.baseUrl}/${storeId}/api-credentials`)
            .pipe(map(response => response.data));
    }

    createApiCredential(storeId: string, payload: CreateStoreApiCredential) {
        return this.http
            .post<ApiResponse<CreatedStoreApiCredential>>(`${this.baseUrl}/${storeId}/api-credentials`, payload)
            .pipe(map(response => response.data));
    }

    deleteApiCredential(storeId: string, credentialId: string) {
        return this.http
            .delete<ApiResponse<StoreApiCredential>>(`${this.baseUrl}/${storeId}/api-credentials/${credentialId}`)
            .pipe(map(response => response.data));
    }

    // Integration jobs

    getJobs(storeId: string, query: JobListQuery = {}) {
        return this.http
            .get<ApiResponse<IntegrationJob[]>>(`${this.baseUrl}/${storeId}/jobs`, { params: toHttpParams(query) })
            .pipe(map(response => response.data));
    }

    retryJob(storeId: string, jobId: string) {
        return this.http
            .post<ApiResponse<IntegrationJob>>(`${this.baseUrl}/${storeId}/jobs/${jobId}/retry`, {})
            .pipe(map(response => response.data));
    }
}
