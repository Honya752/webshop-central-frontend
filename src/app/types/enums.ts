// Mirrors the enums of the backend Prisma schema.

export type GlobalRole = 'USER' | 'MODERATOR' | 'SYSADMIN';

export type StoreRole = 'ADMIN' | 'MODERATOR' | 'VIEWER';

export type IntegrationType = 'WOOCOMMERCE' | 'SHOPIFY';

export type WholesalerIntegrationType = 'EXAMPLEWHOLESALER' | 'JSON_INTEGRATION' | 'XML_INTEGRATION';

export type OrderStatus =
    | 'PROCESSING'
    | 'ORDERED_FROM_WHOLESALER'
    | 'SHIPPING_TO_STORE'
    | 'COMPLETED'
    | 'CANCELLED'
    | 'NEEDS_ATTENTION';

export type OrderItemIssue = 'UNKNOWN_PRODUCT' | 'OUT_OF_STOCK' | 'WHOLESALER_REJECTED';

export type WholesalerOrderMode = 'AUTOMATIC' | 'MANUAL';

export type WholesalerOrderStatus = 'DRAFT' | 'SENDING' | 'SENT' | 'REJECTED' | 'SEND_FAILED' | 'CANCELLED';

export type IntegrationJobType = 'WEBHOOK_EVENT' | 'STOCK_SYNC' | 'PRODUCT_SYNC' | 'WHOLESALER_ORDER_SEND' | 'WEBSHOP_ORDER_NOTE';

export type IntegrationJobStatus = 'PENDING' | 'RUNNING' | 'DONE' | 'FAILED';
