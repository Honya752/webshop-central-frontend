import { GlobalRole, StoreRole } from './enums';

export type StoreMembership = {
    id: string;
    storeId: string;
    role: StoreRole;
    name: string;
    baseUrl: string;
};

export type User = {
    id: string;
    name: string;
    email: string;
    globalRole: GlobalRole;
    storeMembership?: StoreMembership | null;
};

export type CreateStoreMembership = {
    storeId: string;
    role?: StoreRole;
};

export type UpdateStoreMembership = {
    storeId?: string;
    role?: StoreRole;
};

export type CreateUser = {
    name: string;
    email: string;
    password: string;
    globalRole?: GlobalRole;
    storeMembership?: CreateStoreMembership;
};

/** `storeMembership: null` removes the membership of the user. */
export type UpdateUser = {
    name?: string;
    email?: string;
    password?: string;
    globalRole?: GlobalRole;
    storeMembership?: UpdateStoreMembership | null;
};
