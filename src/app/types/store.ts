import { IsoDateString } from './api-response';
import { IntegrationType } from './enums';
import { Order } from './order';
import { ProductWithChannelMapping } from './product';

export type Store = {
    id: string;
    name: string;
    slug: string;
    region: string;
    baseUrl: string;
    integrationType: IntegrationType;
};

export type StoreDetail = Store & {
    products: ProductWithChannelMapping[];
    orders: Order[];
};

export type StoreSummary = {
    id: string;
    name: string;
    baseUrl: string;
};

export type CreateStore = {
    name: string;
    slug: string;
    region: string;
    baseUrl: string;
    integrationType: IntegrationType;
};

/** The slug cannot be changed after creation. */
export type UpdateStore = {
    name?: string;
    region?: string;
    baseUrl?: string;
    integrationType?: IntegrationType;
};

// API credentials the webshop uses to call this system (`/stores/:id/api-credentials`)

export type StoreApiCredential = {
    id: string;
    key: string;
    label: string | null;
    isActive: boolean;
    lastUsedAt: IsoDateString | null;
    expiresAt: IsoDateString | null;
    createdAt: IsoDateString;
};

export type CreateStoreApiCredential = {
    label: string;
    expiresAt: IsoDateString;
};

/** The secret is only returned once, at creation. */
export type CreatedStoreApiCredential = {
    key: string;
    secret: string;
};
