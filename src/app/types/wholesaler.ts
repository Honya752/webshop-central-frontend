import { IsoDateString } from './api-response';
import { WholesalerIntegrationType, WholesalerOrderMode, WholesalerOrderStatus } from './enums';

export type Wholesaler = {
    id: string;
    name: string;
    baseUrl: string;
    integrationType: WholesalerIntegrationType;
    /** Currency of the catalog prices. */
    currency: string;
    /** AUTOMATIC: purchase orders go out after orderDelayMinutes; MANUAL: with "Send now". */
    orderMode: WholesalerOrderMode;
    orderDelayMinutes: number;
};

export type WholesalerStock = {
    productId: string;
    sku: string;
    ean: string;
    name: string | null;
    imageUrl: string | null;
    stock: number;
    /** Wholesale price, in the currency of the wholesaler. */
    price: number;
    updatedAt: IsoDateString;
};

export type WholesalerDetail = Wholesaler & {
    createdAt: IsoDateString;
    updatedAt: IsoDateString;
    stocks: WholesalerStock[];
};

export type CreateWholesaler = {
    name: string;
    baseUrl: string;
    integrationType: WholesalerIntegrationType;
    /** Defaults to HUF. */
    currency?: string;
    orderMode?: WholesalerOrderMode;
    orderDelayMinutes?: number;
};

export type UpdateWholesaler = {
    name?: string;
    baseUrl?: string;
    integrationType?: WholesalerIntegrationType;
    currency?: string;
    orderMode?: WholesalerOrderMode;
    orderDelayMinutes?: number;
};

/** Purchase order to a wholesaler, collecting the lines of the customer orders. */
export type WholesalerOrder = {
    id: string;
    status: WholesalerOrderStatus;
    wholesaler: { id: string; name: string; orderMode: WholesalerOrderMode };
    /** Expected total at the purchase prices. */
    total: number;
    currency: string;
    /** Order number at the wholesaler. */
    externalOrderId: string | null;
    /** AUTOMATIC wholesaler: the DRAFT is sent after this time. */
    sendAfter: IsoDateString | null;
    sentAt: IsoDateString | null;
    /** Refusal reason or last sending error. */
    lastError: string | null;
    createdAt: IsoDateString;
    itemCount?: number;
};

export type WholesalerOrderItem = {
    id: string;
    productId: string | null;
    sku: string;
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
    customerOrderId: string | null;
    customerOrderNumber: string | null;
    store: { id: string; name: string } | null;
};

export type WholesalerOrderDetail = WholesalerOrder & {
    items: WholesalerOrderItem[];
};

export type WholesalerOrderQuery = {
    page?: number;
    limit?: number;
    status?: WholesalerOrderStatus;
    wholesalerId?: string;
};

export type WholesalerCredentialsStatus = {
    configured: boolean;
    apiKeyHint: string | null;
    updatedAt: IsoDateString | null;
};
