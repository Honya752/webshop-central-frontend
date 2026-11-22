import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { map, switchMap, tap } from 'rxjs';
import { environment } from '../../environment';
import { ApiResponse } from '../types/api-response';
import { LoginRequest, LoginResponse, Profile, RegisterRequest } from '../types/auth';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private readonly http = inject(HttpClient);
    private readonly tokenKey = 'token';

    readonly currentUser = signal<Profile | null>(null);
    readonly isSysadmin = computed(() => this.currentUser()?.globalRole === 'SYSADMIN');

    login(payload: LoginRequest) {
        return this.http
            .post<ApiResponse<LoginResponse>>(`${environment.apiUrl}/auth/login`, payload)
            .pipe(
                tap(response => localStorage.setItem(this.tokenKey, response.data.token)),
                switchMap(() => this.loadCurrentUser())
            );
    }

    register(payload: RegisterRequest) {
        return this.http
            .post<ApiResponse<LoginResponse>>(`${environment.apiUrl}/auth/register`, payload)
            .pipe(
                tap(response => localStorage.setItem(this.tokenKey, response.data.token)),
                switchMap(() => this.loadCurrentUser())
            );
    }

    loadCurrentUser() {
        return this.http
            .get<ApiResponse<Profile>>(`${environment.apiUrl}/auth/profile`)
            .pipe(
                map(response => response.data),
                tap(user => this.currentUser.set(user))
            );
    }

    logout(): void {
        localStorage.removeItem(this.tokenKey);
        this.currentUser.set(null);
    }

    getToken(): string | null {
        return localStorage.getItem(this.tokenKey);
    }

    isAuthenticated(): boolean {
        return !!this.getToken();
    }
}
