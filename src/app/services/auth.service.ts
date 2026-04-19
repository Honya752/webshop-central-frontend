import { HttpClient } from "@angular/common/http";
import { inject, Injectable, signal } from "@angular/core";
import { switchMap, tap } from "rxjs";
import { environment } from "../../environment";
import { ApiResponse } from "../types/api-response";

type LoginRequest = {
    email: string;
    password: string;
}

type RegisterRequest = {
    email: string;
    name: string;
    password: string;
}

type UserData = {
    id: string;
    name: string;
    email: string;
    globalRole: string;
}

type LoginResponse = {
    token: string;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private http = inject(HttpClient);
    private readonly tokenKey = 'token';

    currentUser = signal<UserData | null>(null);

    login(payload: LoginRequest) {
        return this.http
            .post<ApiResponse<LoginResponse>>(`${environment.apiUrl}/auth/login`, payload)
            .pipe(
                tap((response) => {
                    const token = response.data.token;
                    localStorage.setItem(this.tokenKey, token);
                }),
                switchMap(() => this.loadCurrentUser())
            );
    }

    register(payload: RegisterRequest) {
        return this.http
            .post<ApiResponse<LoginResponse>>(`${environment.apiUrl}/auth/register`, payload)
            .pipe(
                tap((response) => {
                    const token = response.data.token;
                    localStorage.setItem(this.tokenKey, token);
                }),
                switchMap(() => this.loadCurrentUser())
            )
    }

    loadCurrentUser() {
        return this.http
            .get<ApiResponse<UserData>>(`${environment.apiUrl}/auth/profile`)
            .pipe(
                tap((response) => {
                    const user = response.data
                    this.currentUser.set(user);
                })
            )

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