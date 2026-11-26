import { IsoDateString, PaginationQuery, SortOrder } from './api-response';

export type ProductImage = {
    id: string;
    url: string;
    alt: string;
};

export type ProductLocalization = {
    region: string;
    name: string;
    description: string;
};

export type ProductStock = {
    wholesalerId: string;
    name: string;
    baseUrl: string;
    stock: number;
    /** Purchase price at the wholesaler, in `currency`. */
    price: number;
    /** Currency of the wholesaler. */
    currency: string;
    updatedAt?: IsoDateString;
};

export type ProductOrder = {
    orderId: string;
    storeId: string;
    storeName: string;
    currency: string;
    quantity: number;
    unitPrice: number;
    createdAt: IsoDateString;
};

export type ProductChannelMapping = {
    id: string;
    externalUrl: string | null;
    externalId: string;
    lastSyncedAt: IsoDateString | null;
    storeId: string;
    storeName: string;
};

/** Product localized to a single region (list, single product, order items, store products). */
export type Product = {
    id: string;
    sku: string;
    ean: string;
    /** Base price in `currency`; the selling price of a store is calculated from it. */
    price: number;
    /** ISO 4217 code, e.g. HUF. */
    currency: string;
    brand: string;
    category: string;
    name: string;
    description: string;
    stock?: ProductStock | null;
    images?: ProductImage[];
    createdAt: IsoDateString;
    updatedAt: IsoDateString;
};

/** Full product data with every localization, stock, mapping and order (`GET /products/:id/data`). */
export type ProductDetail = {
    id: string;
    sku: string;
    ean: string;
    /** Base price in `currency`; the selling price of a store is calculated from it. */
    price: number;
    /** ISO 4217 code, e.g. HUF. */
    currency: string;
    brand: string;
    category: string;
    createdAt: IsoDateString;
    updatedAt: IsoDateString;
    images: ProductImage[];
    localizations: ProductLocalization[];
    stocks: ProductStock[];
    orders: ProductOrder[];
    mappings: ProductChannelMapping[];
};

export type ProductWithChannelMapping = {
    data: Product;
    mapping: ProductChannelMapping;
};

export type ProductSortBy = 'createdAt' | 'price' | 'sku' | 'ean';

export type ProductFilterQuery = PaginationQuery & {
    search?: string;
    sortBy?: ProductSortBy;
    sortOrder?: SortOrder;
};

export type CreateProductImage = {
    url: string;
    alt: string;
};

export type CreateProduct = {
    sku: string;
    ean: string;
    /** At most 2 decimals. */
    price: number;
    /** Defaults to HUF. */
    currency?: string;
    brand: string;
    category: string;
    localizations: ProductLocalization[];
    images: CreateProductImage[];
};

export type UpdateProductLocalization = {
    region: string;
    name?: string;
    description?: string;
};

export type UpdateProductImage = {
    url: string;
    alt?: string;
};

export type UpdateProduct = {
    sku?: string;
    ean?: string;
    price?: number;
    currency?: string;
    brand?: string;
    category?: string;
    localizations?: UpdateProductLocalization[];
    images?: UpdateProductImage[];
};
