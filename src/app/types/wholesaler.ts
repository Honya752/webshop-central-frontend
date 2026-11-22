import { IsoDateString } from './api-response';
import { WholesalerIntegrationType } from './enums';

export type Wholesaler = {
    id: string;
    name: string;
    baseUrl: string;
    integrationType: WholesalerIntegrationType;
};

export type WholesalerDetail = Wholesaler & {
    createdAt: IsoDateString;
    updatedAt: IsoDateString;
};

export type CreateWholesaler = {
    name: string;
    baseUrl: string;
    integrationType: WholesalerIntegrationType;
};

export type UpdateWholesaler = {
    name?: string;
    baseUrl?: string;
    integrationType?: WholesalerIntegrationType;
};
