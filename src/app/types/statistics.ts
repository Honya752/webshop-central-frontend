import { IsoDateString } from './api-response';
import { OrderStatus } from './enums';

// Mirrors the registry of the backend statistics module (GET /statistics/metadata)

export type StatisticsMetric =
    | 'revenue'
    | 'orders'
    | 'itemsSold'
    | 'avgOrderValue'
    | 'customers'
    | 'cost'
    | 'profit'
    | 'margin'
    | 'cancelledOrders'
    | 'cancellationRate'
    | 'needsAttention';

export type StatisticsDimension =
    | 'day'
    | 'week'
    | 'month'
    | 'store'
    | 'product'
    | 'category'
    | 'brand'
    | 'wholesaler'
    | 'status'
    | 'paymentMethod';

/** Query of `GET /statistics/query`. Dates are calendar days (YYYY-MM-DD). */
export type StatisticsQuery = {
    metrics?: StatisticsMetric[];
    /** Up to 2 dimensions, at most one of day / week / month. */
    groupBy?: StatisticsDimension[];
    from?: string;
    to?: string;
    currency?: string;
    storeId?: string[];
    status?: OrderStatus[];
    productId?: string[];
    wholesalerId?: string[];
    category?: string[];
    brand?: string[];
    /** A requested metric or dimension, `-` prefix for descending, e.g. `-revenue`. */
    sort?: string;
    limit?: number;
    compare?: 'previous';
    lang?: string;
};

/**
 * One row per group: the dimension keys, `<dimension>Label` for store / product / wholesaler,
 * and the requested metrics.
 */
export type StatisticsRow = Record<string, string | number | null>;

export type StatisticsResult = {
    meta: {
        from: string;
        to: string;
        currency: string;
        timeZone: string;
        metrics: StatisticsMetric[];
        groupBy: StatisticsDimension[];
        statuses: OrderStatus[];
        storeIds: string[] | null;
    };
    totals: Partial<Record<StatisticsMetric, number>>;
    /** Only with `compare: 'previous'`; `change` is in %, null if the previous value was 0. */
    previous?: {
        from: string;
        to: string;
        totals: Partial<Record<StatisticsMetric, number>>;
        change: Partial<Record<StatisticsMetric, number | null>>;
    };
    rows: StatisticsRow[];
};

export type StatisticsMetadata = {
    metrics: Record<StatisticsMetric, { money: boolean; description: string }>;
    dimensions: Record<StatisticsDimension, { time?: string; labelled?: string; description: string }>;
};

export type InsightsQuery = {
    storeId?: string[];
    /** Sales of the last N days are considered (default 30). */
    days?: number;
    lang?: string;
};

export type StockAlertQuery = InsightsQuery & {
    /** Alert if the stock lasts at most this many days (default 14). */
    horizonDays?: number;
};

export type ProductActivity = {
    productId: string;
    sku: string;
    name: string;
    /** Largest stock of one wholesaler (as pushed to the webshops). */
    stock: number;
    soldInPeriod: number;
    lastSoldAt: IsoDateString | null;
};

export type StockAlert = ProductActivity & {
    dailySales: number;
    /** Days the stock lasts at the current sales speed (0: out of stock). */
    daysLeft: number;
};

export type StoreHealth = {
    storeId: string;
    name: string;
    slug: string;
    integrationType: string;
    credentialsConfigured: boolean;
    uploadedProducts: number;
    lastSyncedAt: IsoDateString | null;
    lastOrderAt: IsoDateString | null;
    lastWebhookAt: IsoDateString | null;
    needsAttentionOrders: number;
    pendingJobs: number;
    failedJobs: number;
};
