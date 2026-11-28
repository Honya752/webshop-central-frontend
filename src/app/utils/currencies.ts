/** Currency used when none is given (mirrors the backend default). */
export const DEFAULT_CURRENCY = 'HUF';

/**
 * Currencies offered in the forms. The backend converts between them with the ECB reference rates,
 * so only currencies the ECB publishes a rate for (plus EUR) are listed.
 */
export const CURRENCY_OPTIONS: { label: string; value: string }[] = [
    { label: 'HUF - Hungarian forint', value: 'HUF' },
    { label: 'EUR - Euro', value: 'EUR' },
    { label: 'USD - US dollar', value: 'USD' },
    { label: 'GBP - British pound', value: 'GBP' },
    { label: 'CHF - Swiss franc', value: 'CHF' },
    { label: 'CZK - Czech koruna', value: 'CZK' },
    { label: 'PLN - Polish zloty', value: 'PLN' },
    { label: 'RON - Romanian leu', value: 'RON' },
    { label: 'SEK - Swedish krona', value: 'SEK' },
    { label: 'DKK - Danish krone', value: 'DKK' },
    { label: 'NOK - Norwegian krone', value: 'NOK' },
];

/** Currencies whose amounts are shown without decimals (same list as the backend pricing service). */
const ZERO_DECIMAL_CURRENCIES = new Set(['HUF', 'JPY', 'KRW', 'ISK', 'CLP', 'VND']);

export function currencyDecimals(currency: string | null | undefined): number {
    return currency && ZERO_DECIMAL_CURRENCIES.has(currency.toUpperCase()) ? 0 : 2;
}
