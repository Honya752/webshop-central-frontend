import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map } from 'rxjs';
import { environment } from '../../environment';
import { ApiPaginationResponse, ApiResponse, PaginationQuery } from '../types/api-response';
import { CreateUser, UpdateUser, User } from '../types/user';
import { toHttpParams } from '../utils/http-params';

@Injectable({
    providedIn: 'root'
})
export class UsersService {
    private readonly http = inject(HttpClient);

    getAllUsers(query: PaginationQuery) {
        return this.http
            .get<ApiPaginationResponse<User>>(`${environment.apiUrl}/users`, { params: toHttpParams(query) })
            .pipe(map(({ data: users, meta }) => ({ users, meta })));
    }

    getUserData(id: string) {
        return this.http
            .get<ApiResponse<User>>(`${environment.apiUrl}/users/${id}`)
            .pipe(map(response => response.data));
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
