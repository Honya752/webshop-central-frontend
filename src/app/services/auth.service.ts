import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, finalize, map, Observable, of, shareReplay, switchMap, tap } from 'rxjs';
import { environment } from '../../environment';
import { ApiResponse } from '../types/api-response';
import { LoginRequest, LoginResponse, Profile, RegisterRequest } from '../types/auth';
import { StoreRole } from '../types/enums';

const STORE_ROLE_RANK: Record<StoreRole, number> = {
    VIEWER: 1,
    MODERATOR: 2,
    ADMIN: 3,
};

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private readonly http = inject(HttpClient);
    private readonly tokenKey = 'token';

    /** In-flight profile request, shared by the guards and the app start. */
    private profileRequest$?: Observable<Profile | null>;

    readonly currentUser = signal<Profile | null>(null);

    // ---------- roles (mirrors the backend guards)

    readonly isSysadmin = computed(() => this.currentUser()?.globalRole === 'SYSADMIN');
    /** Can create, edit and delete products (global MODERATOR or SYSADMIN). */
    readonly canManageProducts = computed(() => {
        const role = this.currentUser()?.globalRole;
        return role === 'SYSADMIN' || role === 'MODERATOR';
    });
    readonly membership = computed(() => this.currentUser()?.storeMembership ?? null);
    /** ID of the store the user belongs to, if any. */
    readonly ownStoreId = computed(() => this.membership()?.store.id ?? null);

    /** True if the user is a SYSADMIN, or a member of the store with at least `required` role. */
    hasStoreRole(storeId: string | null | undefined, required: StoreRole): boolean {
        if (this.isSysadmin()) return true;

        const membership = this.membership();
        if (!storeId || !membership || membership.store.id !== storeId) return false;

        return STORE_ROLE_RANK[membership.role] >= STORE_ROLE_RANK[required];
    }

    // ---------- session

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

    /**
     * The logged in user, loading the profile first if needed (e.g. after a page reload).
     * Null if there is no token or the profile could not be loaded.
     */
    ensureCurrentUser(): Observable<Profile | null> {
        const user = this.currentUser();
        if (user) return of(user);
        if (!this.isAuthenticated()) return of(null);

        this.profileRequest$ ??= this.loadCurrentUser().pipe(
            catchError(() => {
                this.logout();
                return of(null);
            }),
            finalize(() => this.profileRequest$ = undefined),
            shareReplay(1),
        );

        return this.profileRequest$;
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
