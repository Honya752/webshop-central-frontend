import { HttpClient } from "@angular/common/http";
import { ApplicationConfig, inject, Injectable } from "@angular/core";
import { ApiPaginationResponse, ApiResponse } from "../types/api-response";
import { environment } from "../../environment";
import { map, tap } from "rxjs";

type ProductImages = {
    id: string;
    url: string;
    alt: string;
}

export type Product = {
    id: string;
    sku: string;
    ean: string;
    price: number;
    name: string;
    description: string;
    images: ProductImages[];
}

export type AllProductData = {
    id: string;
    sku: string;
    ean: string;
    price: number;
    localizations: ProductLocalization[];
    images: ProductImages[];
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

export type CreateProduct = {
    sku: string;
    ean: string;
    price: number;
    localizations: ProductLocalization[];
    images: CreateProductImage[];
}

@Injectable({
    providedIn: 'root'
})
export class ProductsService {
    private http = inject(HttpClient);

    getProducts(page: number, limit: number) {
        return this.http
            .get<ApiPaginationResponse<Product>>(`${environment.apiUrl}/products`, {
                params: { page, limit }
            })
            .pipe(map((response) => {
                const { data: products, meta } = response;
                return { products, meta };
            }))
    }

    getAllProductData(id: string) {
        return this.http
            .get<ApiResponse<AllProductData>>(`${environment.apiUrl}/products/${id}/data`)
            .pipe(map((response) => {
                return response.data;
            }));
    }

    createProduct(payload: CreateProduct) {
        return this.http
            .post<ApiResponse<Product>>(`${environment.apiUrl}/products`, payload);
    }
}