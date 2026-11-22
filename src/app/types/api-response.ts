/** Every successful backend response is wrapped by the ResponseInterceptor into `{ data }`. */
export type ApiResponse<T> = {
    data: T;
};

export type PaginationMeta = {
    total: number;
    page: number;
    limit: number;
    pages: number;
};

export type ApiPaginationResponse<T> = {
    data: T[];
    meta: PaginationMeta;
};

/** Shape of every error returned by the backend HttpExceptionFilter. */
export type ApiErrorResponse = {
    success: false;
    statusCode: number;
    /** Either a plain message or field validation errors keyed by field name. */
    message: string | Record<string, string[]>;
};

export type PaginationQuery = {
    page?: number;
    limit?: number;
};

export type SortOrder = 'asc' | 'desc';

export type IdResponse = {
    id: string;
};

/** Dates arrive as ISO 8601 strings in JSON responses. */
export type IsoDateString = string;
