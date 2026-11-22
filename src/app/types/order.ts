import { IsoDateString, PaginationQuery, SortOrder } from './api-response';
import { OrderItemIssue, OrderStatus } from './enums';
import { Product } from './product';

export type OrderStore = {
    id: string;
    name: string;
    baseUrl: string;
};

export type OrderItem = {
    id: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    total: number;
    issue: OrderItemIssue | null;
    /** Missing when the ordered SKU is unknown to the system. */
    product?: Product;
};

export type Order = {
    id: string;
    status: OrderStatus;
    currency: string;
    total: number;
    paymentMethod: string | null;
    createdAtExternal: IsoDateString | null;
    createdAt: IsoDateString;
    store: OrderStore;
};

export type OrderDetail = Order & {
    name: string;
    email: string;
    updatedAt: IsoDateString;
    orderItems: OrderItem[];
};

export type OrderSortBy = 'createdAt' | 'total' | 'status';

export type OrderFilterQuery = PaginationQuery & {
    sortBy?: OrderSortBy;
    sortOrder?: SortOrder;
};

export type OrderStatusResponse = {
    status: OrderStatus;
};
