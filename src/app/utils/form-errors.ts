import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl } from '@angular/forms';
import { getApiErrorMessage } from './api-error';

/**
 * Shows the validation errors of a failed save on the matching form controls (as the `server` error),
 * and returns the message to show above the form.
 */
export function applyServerErrors(form: AbstractControl, error: unknown, fallback: string): string {
    const message = error instanceof HttpErrorResponse ? error.error?.message : null;

    if (message && typeof message === 'object') {
        let appliedToField = false;

        for (const [field, messages] of Object.entries(message as Record<string, string[]>)) {
            const control = form.get(field);
            if (control && Array.isArray(messages) && messages.length) {
                control.setErrors({ ...control.errors, server: messages[0] });
                control.markAsTouched();
                appliedToField = true;
            }
        }

        return appliedToField ? 'Please correct the highlighted fields' : fallback;
    }

    return getApiErrorMessage(error, fallback);
}
