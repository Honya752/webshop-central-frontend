import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map } from 'rxjs';
import { environment } from '../../environment';
import { ApiPaginationResponse, ApiResponse, IdResponse } from '../types/api-response';
import { CreateProduct, Product, ProductDetail, ProductFilterQuery, UpdateProduct } from '../types/product';
import { toHttpParams } from '../utils/http-params';

@Injectable({
    providedIn: 'root'
})
export class ProductsService {
    private readonly http = inject(HttpClient);

    getProducts(query: ProductFilterQuery) {
        return this.http
            .get<ApiPaginationResponse<Product>>(`${environment.apiUrl}/products`, { params: toHttpParams(query) })
            .pipe(map(({ data: products, meta }) => ({ products, meta })));
    }

    getProduct(id: string) {
        return this.http
            .get<ApiResponse<Product>>(`${environment.apiUrl}/products/${id}`)
            .pipe(map(response => response.data));
    }

    getAllProductData(id: string) {
        return this.http
            .get<ApiResponse<ProductDetail>>(`${environment.apiUrl}/products/${id}/data`)
            .pipe(map(response => response.data));
    }

    createProduct(payload: CreateProduct) {
        return this.http
            .post<ApiResponse<Product>>(`${environment.apiUrl}/products`, payload)
            .pipe(map(response => response.data));
    }

    updateProduct(payload: UpdateProduct, id: string) {
        return this.http
            .patch<ApiResponse<Product>>(`${environment.apiUrl}/products/${id}`, payload)
            .pipe(map(response => response.data));
    }

    deleteProduct(id: string) {
        return this.http
            .delete<ApiResponse<IdResponse>>(`${environment.apiUrl}/products/${id}`)
            .pipe(map(response => response.data));
    }
}
