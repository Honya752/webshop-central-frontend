export type ApiResponse<T> = {
    data: T;
}

export type ApiPaginationResponse<T> = {
    data: [T];
    meta: {
        total: number;
        page: number;
        limit: number;
        pages: number;
    }
}