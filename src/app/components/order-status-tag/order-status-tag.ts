import { Component, computed, input } from '@angular/core';
import { TagModule } from 'primeng/tag';
import { OrderStatus } from '../../types/enums';

type TagSeverity = 'secondary' | 'warn' | 'info' | 'success' | 'danger' | 'contrast';

const STATUS_TAGS: Record<OrderStatus, { label: string; severity: TagSeverity }> = {
    PROCESSING: { label: 'Processing', severity: 'secondary' },
    ORDERED_FROM_WHOLESALER: { label: 'Ordered', severity: 'warn' },
    SHIPPING_TO_STORE: { label: 'Shipping', severity: 'info' },
    COMPLETED: { label: 'Completed', severity: 'success' },
    CANCELLED: { label: 'Cancelled', severity: 'danger' },
    NEEDS_ATTENTION: { label: 'Needs attention', severity: 'contrast' },
};

@Component({
    selector: 'app-order-status-tag',
    imports: [TagModule],
    template: `
        @if (tag(); as tag) {
            <p-tag [severity]="tag.severity" [value]="tag.label" />
        }
    `,
})
export class OrderStatusTag {
    readonly status = input<OrderStatus | null | undefined>();

    readonly tag = computed(() => {
        const status = this.status();
        return status ? STATUS_TAGS[status] : null;
    });
}
