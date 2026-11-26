import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map } from 'rxjs';
import { environment } from '../../environment';
import { ApiResponse } from '../types/api-response';
import {
    InsightsQuery,
    ProductActivity,
    StatisticsMetadata,
    StatisticsQuery,
    StatisticsResult,
    StockAlert,
    StockAlertQuery,
    StoreHealth,
} from '../types/statistics';
import { toHttpParams } from '../utils/http-params';

/** The backend takes list filters as comma separated values. */
function toQueryParams(query: object) {
    const flat = Object.fromEntries(
        Object.entries(query).map(([key, value]) => [key, Array.isArray(value) ? value.join(',') : value])
    );
    return toHttpParams(flat);
}

@Injectable({
    providedIn: 'root'
})
export class StatisticsService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${environment.apiUrl}/statistics`;

    query(query: StatisticsQuery) {
        return this.http
            .get<ApiResponse<StatisticsResult>>(`${this.baseUrl}/query`, { params: toQueryParams(query) })
            .pipe(map(response => response.data));
    }

    metadata() {
        return this.http
            .get<ApiResponse<StatisticsMetadata>>(`${this.baseUrl}/metadata`)
            .pipe(map(response => response.data));
    }

    stockAlerts(query: StockAlertQuery = {}) {
        return this.http
            .get<ApiResponse<StockAlert[]>>(`${this.baseUrl}/stock-alerts`, { params: toQueryParams(query) })
            .pipe(map(response => response.data));
    }

    slowMovers(query: InsightsQuery = {}) {
        return this.http
            .get<ApiResponse<ProductActivity[]>>(`${this.baseUrl}/slow-movers`, { params: toQueryParams(query) })
            .pipe(map(response => response.data));
    }

    integrationHealth(query: InsightsQuery = {}) {
        return this.http
            .get<ApiResponse<StoreHealth[]>>(`${this.baseUrl}/integration-health`, { params: toQueryParams(query) })
            .pipe(map(response => response.data));
    }
}
