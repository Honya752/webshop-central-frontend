import { GlobalRole, IntegrationType, StoreRole } from './enums';

export type LoginRequest = {
    email: string;
    password: string;
};

export type RegisterRequest = {
    email: string;
    name: string;
    password: string;
};

export type LoginResponse = {
    token: string;
};

export type ProfileStore = {
    id: string;
    slug: string;
    name: string;
    region: string;
    integrationType: IntegrationType;
};

export type ProfileMembership = {
    role: StoreRole;
    store: ProfileStore;
};

export type Profile = {
    id: string;
    name: string;
    email: string;
    globalRole: GlobalRole;
    /** The store the user belongs to, null if none. */
    storeMembership: ProfileMembership | null;
};
