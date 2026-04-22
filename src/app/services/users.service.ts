import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { ApiPaginationResponse, ApiResponse } from "../types/api-response";
import { environment } from "../../environment";
import { map } from "rxjs";

export type StoreMembership = {
    id: string;
    storeId: string;
    role: string;
    name: string;
    baseUrl: string;
};

export type User = {
    id: string;
    name: string;
    email: string;
    globalRole: string;
    storeMembership?: StoreMembership;
};

export type CreateStoreMembership = {
    storeId: string;
    role?: string;
};

export type UpdateStoreMembership = {
    storeId?: string;
    role?: string;
};

export type CreateUser = {
    name: string;
    email: string;
    password: string;
    globalRole: string;
    storeMembership?: CreateStoreMembership;
};

export type UpdateUser = {
    name?: string;
    email?: string;
    password?: string;
    globalRole?: string;
    storeMembership?: UpdateStoreMembership | null;
};

@Injectable({
    providedIn: 'root'
})
export class UsersService {
    private http = inject(HttpClient);

    getAllUsers(page: number, limit: number) {
        return this.http
            .get<ApiPaginationResponse<User>>(`${environment.apiUrl}/users`, { params: { page, limit } })
            .pipe(map(respose => {
                const { data: users, meta } = respose;
                return { users, meta };
            }))
    }

    getUserData(id: string) {
        return this.http
            .get<ApiResponse<User>>(`${environment.apiUrl}/users/${id}`)
            .pipe(map(response => {
                return response.data;
            }))
    }

    createUser(payload: CreateUser) {
        return this.http
            .post<ApiResponse<User>>(`${environment.apiUrl}/users`, payload)
            .pipe(map(response => response.data));
    }

    updateUser(payload: UpdateUser, id: string) {
        return this.http
            .patch<ApiResponse<User>>(`${environment.apiUrl}/users/${id}`, payload)
            .pipe(map(response => response.data));
    }

    deleteUser(id: string) {
        return this.http
            .delete<ApiResponse<User>>(`${environment.apiUrl}/users/${id}`)
            .pipe(map(response => response.data));
    }
}