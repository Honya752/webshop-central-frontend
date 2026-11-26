import { Component, computed, input } from '@angular/core';
import { TagModule } from 'primeng/tag';
import { WholesalerOrderStatus } from '../../types/enums';

type TagSeverity = 'secondary' | 'warn' | 'info' | 'success' | 'danger' | 'contrast';

const STATUS_TAGS: Record<WholesalerOrderStatus, { label: string; severity: TagSeverity }> = {
    DRAFT: { label: 'Collecting', severity: 'secondary' },
    SENDING: { label: 'Sending', severity: 'info' },
    SENT: { label: 'Sent', severity: 'success' },
    REJECTED: { label: 'Refused', severity: 'danger' },
    SEND_FAILED: { label: 'Send failed', severity: 'warn' },
    CANCELLED: { label: 'Cancelled', severity: 'contrast' },
};

@Component({
    selector: 'app-wholesaler-order-status-tag',
    imports: [TagModule],
    template: `
        @if (tag(); as tag) {
            <p-tag [severity]="tag.severity" [value]="tag.label" />
        }
    `,
})
export class WholesalerOrderStatusTag {
    readonly status = input<WholesalerOrderStatus | null | undefined>();

    readonly tag = computed(() => {
        const status = this.status();
        return status ? STATUS_TAGS[status] : null;
    });
}
