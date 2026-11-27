import { IsoDateString, PaginationQuery, SortOrder } from './api-response';
import { OrderItemIssue, OrderStatus, WholesalerOrderStatus } from './enums';
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
    /** Wholesaler the stock was taken from (order details only). */
    wholesaler?: { id: string; name: string } | null;
    /** Purchase order this line is ordered with (order details only). */
    wholesalerOrder?: { id: string; status: WholesalerOrderStatus; externalOrderId: string | null } | null;
};

export type Order = {
    id: string;
    /** Order number in the webshop. */
    externalOrderId: string;
    /** Page of the order in the webshop admin. */
    externalUrl: string | null;
    name: string;
    email: string;
    status: OrderStatus;
    /** Statuses the order can be changed to. */
    nextStatuses: OrderStatus[];
    currency: string;
    total: number;
    paymentMethod: string | null;
    createdAtExternal: IsoDateString | null;
    createdAt: IsoDateString;
    store: OrderStore;
};

export type OrderDetail = Order & {
    updatedAt: IsoDateString;
    orderItems: OrderItem[];
};

export type OrderSortBy = 'createdAt' | 'total' | 'status';

export type OrderFilterQuery = PaginationQuery & {
    sortBy?: OrderSortBy;
    sortOrder?: SortOrder;
    status?: OrderStatus;
    /** Searches the webshop order ID, customer name and email. */
    search?: string;
};

export type OrderStatusResponse = {
    status: OrderStatus;
};
