import { IsoDateString } from './api-response';
import { WholesalerIntegrationType } from './enums';

export type Wholesaler = {
    id: string;
    name: string;
    baseUrl: string;
    integrationType: WholesalerIntegrationType;
    /** Currency of the catalog prices. */
    currency: string;
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
};

export type UpdateWholesaler = {
    name?: string;
    baseUrl?: string;
    integrationType?: WholesalerIntegrationType;
    currency?: string;
};
