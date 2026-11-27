import { Pipe, PipeTransform } from '@angular/core';
import { currencyDecimals } from '../utils/currencies';

/**
 * Formats an amount in the given currency: `{{ price | money:currency }}`.
 * HUF and other zero-decimal currencies are shown without decimals, the rest with 2.
 * Letter codes get a space ("HUF 41,988"), symbols do not ("€12.50"), like Intl does.
 */
@Pipe({
    name: 'money',
})
export class MoneyPipe implements PipeTransform {
    transform(amount: number | null | undefined, currency: string | null | undefined): string | null {
        if (amount === null || amount === undefined || !currency) return null;

        const decimals = currencyDecimals(currency);
        try {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency,
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals,
            }).format(amount);
        } catch {
            // unknown currency code
            return `${amount.toFixed(decimals)} ${currency}`;
        }
    }
}
