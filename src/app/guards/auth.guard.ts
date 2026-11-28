import { inject } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivateFn, Router, UrlTree } from "@angular/router";
import { map, Observable } from "rxjs";
import { MessageService } from "primeng/api";
import { AuthService } from "../services/auth.service";
import { Profile } from "../types/auth";
import { StoreRole } from "../types/enums";

/** Logged in users only. */
export const authGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.isAuthenticated()) {
        return true;
    }

    return router.createUrlTree(['/login']);
}

/**
 * Runs `allowed` once the profile is loaded (also after a page reload); otherwise sends the user
 * to the login page (not logged in) or to the dashboard with a message (no permission).
 */
function roleGuard(allowed: (authService: AuthService, user: Profile, route: ActivatedRouteSnapshot) => boolean): CanActivateFn {
    return (route): Observable<boolean | UrlTree> => {
        const authService = inject(AuthService);
        const router = inject(Router);
        const messageService = inject(MessageService);

        return authService.ensureCurrentUser().pipe(
            map(user => {
                if (!user) return router.createUrlTree(['/login']);
                if (allowed(authService, user, route)) return true;

                messageService.add({
                    severity: 'warn',
                    summary: 'No access',
                    detail: 'You do not have permission to open this page',
                });
                return router.createUrlTree(['/dashboard']);
            })
        );
    };
}

/** SYSADMIN only. */
export const sysadminGuard = roleGuard(auth => auth.isSysadmin());

/** Global MODERATOR or SYSADMIN (creating and editing products). */
export const productManagerGuard = roleGuard(auth => auth.canManageProducts());

/** SYSADMIN, or a member of the store in the `:id` route parameter with at least `role`. */
export function storeRoleGuard(role: StoreRole): CanActivateFn {
    return roleGuard((auth, _user, route) => auth.hasStoreRole(route.paramMap.get('id'), role));
}
