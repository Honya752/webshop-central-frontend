import { HttpParams } from '@angular/common/http';

type QueryValue = string | number | boolean | null | undefined;

/** Builds HttpParams from a query object, skipping undefined, null and empty string values. */
export function toHttpParams(query: object): HttpParams {
    let params = new HttpParams();

    for (const [key, value] of Object.entries(query) as [string, QueryValue][]) {
        if (value === undefined || value === null || value === '') continue;
        params = params.set(key, String(value));
    }

    return params;
}
