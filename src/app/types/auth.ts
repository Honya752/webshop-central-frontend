import { GlobalRole } from './enums';

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

export type Profile = {
    id: string;
    name: string;
    email: string;
    globalRole: GlobalRole;
};
