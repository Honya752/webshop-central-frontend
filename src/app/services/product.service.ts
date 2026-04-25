import { HttpClient } from "@angular/common/http";
import { ApplicationConfig, inject, Injectable, Signal } from "@angular/core";
import { ApiPaginationResponse, ApiResponse } from "../types/api-response";
import { environment } from "../../environment";
import { map, tap } from "rxjs";

type ProductImages = {
    id: string;
    url: string;
    alt: string;
}

type ProducStock = {
    wholesalerId: string;
    name: string;
    baseUrl: string;
    stock: number;
    price: number;
}

export type Product = {
    id: string;
    sku: string;
    ean: string;
    price: number;
    name: string;
    category: string;
    brand: string;
    description: string;
    stock: ProducStock | null;
    images: ProductImages[];
}

export type ProductMapping = {
    id: string;
    externalUrl: string;
    externalId: string;
    lastSyncedAt: Date;
    storeName: string;
    storeId: string;
}

export type ProductOrders = {
    orderId: string;
    storeId: string;
    storeName: string;
    quantity: number;
    unitPrice: number;
    currency: string;
    createAt: Date;
}

export type ProductDetail = {
    id: string;
    sku: string;
    ean: string;
    price: number;
    brand: string;
    category: string;
    createdAt: Date;
    updatedAt: Date;
    localizations: ProductLocalization[];
    images: ProductImages[];
    mappings: ProductMapping[];
    orders: ProductOrders[];
    stocks: ProducStock[];
}

type ProductLocalization = {
    region: string;
    name: string;
    description: string;
}

type CreateProductImage = {
    url: string;
    alt: string;
}

type FilterParam = {
    page: number,
    limit: number,
    search: string,
    sortBy: string,
    sortOrder: string
}

export type CreateProduct = {
    sku: string;
    ean: string;
    price: number;
    brand: string;
    category: string;
    localizations: ProductLocalization[];
    images: CreateProductImage[];
}

export type UpdateProduct = {
    sku?: string;
    ean?: string;
    price: number;
    brand?: string;
    category?: string;
    localizations?: ProductLocalization[];
    images?: CreateProductImage[];
}

@Injectable({
    providedIn: 'root'
})
export class ProductsService {
    private http = inject(HttpClient);

    getProducts(param: FilterParam) {
        return this.http
            .get<ApiPaginationResponse<Product>>(`${environment.apiUrl}/products`, { params: param })
            .pipe(map((response) => {
                console.log(response);
                const { data: products, meta } = response;
                return { products, meta };
            }))
    }

    getAllProductData(id: string) {
        return this.http
            .get<ApiResponse<ProductDetail>>(`${environment.apiUrl}/products/${id}/data`)
            .pipe(map((response) => {
                return response.data;
            }));
    }

    createProduct(payload: CreateProduct) {
        return this.http
            .post<ApiResponse<Product>>(`${environment.apiUrl}/products`, payload)
            .pipe(map((response) => {
                return response.data;
            }));
    }

    updateProduct(payload: UpdateProduct, id: string) {
        return this.http
            .patch<ApiResponse<Product>>(`${environment.apiUrl}/products/${id}`, payload)
            .pipe(map(response => response.data));
    }

    deleteProduct(id: string) {
        return this.http
            .delete<ApiResponse<Product>>(`${environment.apiUrl}/products/${id}`)
            .pipe(map((response) => {
                return response.data;
            }));
    }
}