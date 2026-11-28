import { IntegrationType, WholesalerIntegrationType, WholesalerOrderMode } from '../types/enums';

const PLATFORM_LABELS: Record<IntegrationType, string> = {
    WOOCOMMERCE: 'WooCommerce',
    SHOPIFY: 'Shopify',
};

/** Readable name of a webshop platform. */
export function platformLabel(type: IntegrationType | null | undefined): string {
    return type ? PLATFORM_LABELS[type] ?? type : '';
}

const WHOLESALER_INTEGRATION_LABELS: Record<WholesalerIntegrationType, string> = {
    EXAMPLEWHOLESALER: 'Example wholesaler',
    JSON_INTEGRATION: 'JSON feed',
    XML_INTEGRATION: 'XML feed',
};

/** Readable name of how the catalog of a wholesaler is read. */
export function wholesalerIntegrationLabel(type: WholesalerIntegrationType | null | undefined): string {
    return type ? WHOLESALER_INTEGRATION_LABELS[type] ?? type : '';
}

/** How purchase orders go out, e.g. "Automatic, after 15 min" or "Manual". */
export function orderModeLabel(mode: WholesalerOrderMode | null | undefined, delayMinutes?: number | null): string {
    if (mode === 'MANUAL') return 'Manual';
    if (mode === 'AUTOMATIC') return delayMinutes ? `Automatic, after ${delayMinutes} min` : 'Automatic, immediately';
    return '';
}
