import { HttpErrorResponse, HttpInterceptorFn } from "@angular/common/http";
import { AuthService } from "../services/auth.service";
import { inject } from "@angular/core";
import { Router } from "@angular/router";
import { catchError, throwError } from "rxjs";

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const token = authService.getToken();

    if (!token) {
        return next(req);
    }

    const cloneReq = req.clone({
        setHeaders: {
            Authorization: `Bearer ${token}`,
        }
    });

    return next(cloneReq);
}

export const unauthorizeInterceptor: HttpInterceptorFn = (req, next) => {
    const router = inject(Router);
    const authService = inject(AuthService);

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status === 401) {
                authService.logout();

                router.navigate(['/login'], {
                    queryParams: { returnUrl: router.url }
                });
            }

            return throwError(() => error);
        })
    )
}