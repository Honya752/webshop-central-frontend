import { Component, inject, input, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { MessageModule } from 'primeng/message';
import { StoresService } from '../../services/stores.service';
import { IntegrationJob } from '../../types/integration';
import { IntegrationJobStatus, IntegrationJobType } from '../../types/enums';
import { getApiErrorMessage } from '../../utils/api-error';

type TagSeverity = 'secondary' | 'info' | 'success' | 'danger';

/** Background jobs of a store: received webhooks and product / stock syncs. */
@Component({
  selector: 'app-store-jobs',
  imports: [DatePipe, FormsModule, RouterLink, ButtonModule, SelectModule, TableModule, TagModule, MessageModule],
  templateUrl: './store-jobs.html',
})
export class StoreJobs implements OnInit {
  private readonly storesService = inject(StoresService);
  private readonly messageService = inject(MessageService);

  readonly storeId = input.required<string>();

  readonly limit = 50;
  readonly isLoading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly jobs = signal<IntegrationJob[]>([]);
  readonly retrying = signal<string | null>(null);

  statusFilter: IntegrationJobStatus | null = null;

  readonly statusOptions: { label: string; value: IntegrationJobStatus }[] = [
    { label: 'Pending', value: 'PENDING' },
    { label: 'Running', value: 'RUNNING' },
    { label: 'Done', value: 'DONE' },
    { label: 'Failed', value: 'FAILED' },
  ];

  private readonly statusTags: Record<IntegrationJobStatus, { label: string; severity: TagSeverity }> = {
    PENDING: { label: 'Pending', severity: 'secondary' },
    RUNNING: { label: 'Running', severity: 'info' },
    DONE: { label: 'Done', severity: 'success' },
    FAILED: { label: 'Failed', severity: 'danger' },
  };

  private readonly typeLabels: Record<IntegrationJobType, string> = {
    WEBHOOK_EVENT: 'Webhook',
    STOCK_SYNC: 'Stock sync',
    PRODUCT_SYNC: 'Product sync',
    WHOLESALER_ORDER_SEND: 'Purchase order',
    WEBSHOP_ORDER_NOTE: 'Webshop order note',
  };

  ngOnInit(): void {
    this.loadJobs();
  }

  loadJobs() {
    this.isLoading.set(true);
    this.loadError.set(null);

    this.storesService.getJobs(this.storeId(), {
      limit: this.limit,
      ...(this.statusFilter ? { status: this.statusFilter } : {}),
    }).subscribe({
      next: jobs => {
        this.jobs.set(jobs);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.loadError.set(getApiErrorMessage(error, 'Failed to load the jobs'));
        this.isLoading.set(false);
      }
    });
  }

  retry(job: IntegrationJob) {
    this.retrying.set(job.id);

    this.storesService.retryJob(this.storeId(), job.id).subscribe({
      next: () => {
        this.retrying.set(null);
        this.messageService.add({
          severity: 'success',
          summary: 'Job queued',
          detail: 'The job was queued again',
        });
        this.loadJobs();
      },
      error: (error) => {
        this.retrying.set(null);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: getApiErrorMessage(error, 'Failed to retry the job!'),
        });
      }
    });
  }

  statusTag(status: IntegrationJobStatus) {
    return this.statusTags[status];
  }

  typeLabel(type: IntegrationJobType): string {
    return this.typeLabels[type] ?? type;
  }
}
