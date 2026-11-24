import { HttpErrorResponse } from '@angular/common/http';

/** Returns a readable message of a failed backend call. */
export function getApiErrorMessage(error: unknown, fallback: string): string {
    if (!(error instanceof HttpErrorResponse)) return fallback;

    if (error.status === 0) return 'The server is unreachable';
    if (error.status === 403) return 'You do not have permission to do this';

    const message = error.error?.message;
    if (typeof message === 'string' && message) return message;

    return fallback;
}
