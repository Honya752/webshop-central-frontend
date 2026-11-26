import { CurrencyPipe } from '@angular/common';
import { inject, LOCALE_ID, Pipe, PipeTransform } from '@angular/core';
import { currencyDecimals } from '../utils/currencies';

/**
 * Formats an amount in the given currency: `{{ price | money:currency }}`.
 * HUF and other zero-decimal currencies are shown without decimals, the rest with 2.
 */
@Pipe({
    name: 'money',
})
export class MoneyPipe implements PipeTransform {
    private readonly currencyPipe = new CurrencyPipe(inject(LOCALE_ID));

    transform(amount: number | null | undefined, currency: string | null | undefined): string | null {
        if (amount === null || amount === undefined || !currency) return null;

        const decimals = currencyDecimals(currency);
        return this.currencyPipe.transform(amount, currency, 'symbol', `1.${decimals}-${decimals}`);
    }
}
