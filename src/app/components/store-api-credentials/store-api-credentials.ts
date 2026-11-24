import { Component, inject, input, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { MessageModule } from 'primeng/message';
import { StoresService } from '../../services/stores.service';
import { CreatedStoreApiCredential, StoreApiCredential } from '../../types/store';
import { getApiErrorMessage } from '../../utils/api-error';

/** API credentials the webshop uses to call this system. */
@Component({
  selector: 'app-store-api-credentials',
  imports: [DatePipe, ReactiveFormsModule, ButtonModule, InputTextModule, DatePickerModule, TableModule, TagModule, MessageModule],
  templateUrl: './store-api-credentials.html',
})
export class StoreApiCredentials implements OnInit {
  private readonly storesService = inject(StoresService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly fb = inject(FormBuilder);

  readonly storeId = input.required<string>();

  readonly isLoading = signal(false);
  readonly isCreating = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly credentials = signal<StoreApiCredential[]>([]);
  /** The secret is only returned once, right after creation. */
  readonly created = signal<CreatedStoreApiCredential | null>(null);

  readonly minExpiry = this.tomorrow();

  readonly form = this.fb.group({
    label: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(3)]),
    expiresAt: this.fb.control<Date | null>(null, [Validators.required]),
  });

  ngOnInit(): void {
    this.loadCredentials();
  }

  loadCredentials() {
    this.isLoading.set(true);
    this.loadError.set(null);

    this.storesService.getApiCredentials(this.storeId()).subscribe({
      next: credentials => {
        this.credentials.set(credentials);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.loadError.set(getApiErrorMessage(error, 'Failed to load the API keys'));
        this.isLoading.set(false);
      }
    });
  }

  create() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    this.isCreating.set(true);

    this.storesService.createApiCredential(this.storeId(), {
      label: raw.label,
      expiresAt: raw.expiresAt!.toISOString(),
    }).subscribe({
      next: created => {
        this.created.set(created);
        this.form.reset();
        this.isCreating.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'API key created',
          detail: 'API key created successfully',
        });
        this.loadCredentials();
      },
      error: (error) => {
        this.isCreating.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: getApiErrorMessage(error, 'Failed to create the API key!'),
        });
      }
    });
  }

  confirmRevoke(event: Event, credential: StoreApiCredential) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `The webshop can no longer call the API with the key "${credential.label ?? credential.key}". Are you sure?`,
      header: 'Revoke API key',
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: {
        label: 'Cancel',
        severity: 'secondary',
        outlined: true,
      },
      acceptButtonProps: {
        label: 'Revoke',
        severity: 'danger',
      },
      accept: () => this.revoke(credential.id),
    });
  }

  private revoke(credentialId: string) {
    this.storesService.deleteApiCredential(this.storeId(), credentialId).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'API key revoked',
          detail: 'API key revoked successfully',
        });
        this.loadCredentials();
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: getApiErrorMessage(error, 'Failed to revoke the API key!'),
        });
      }
    });
  }

  isExpired(credential: StoreApiCredential): boolean {
    return !!credential.expiresAt && new Date(credential.expiresAt).getTime() <= Date.now();
  }

  copy(value: string) {
    navigator.clipboard?.writeText(value).then(
      () => this.messageService.add({ severity: 'info', summary: 'Copied', detail: 'Copied to the clipboard' }),
      () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to copy to the clipboard' }),
    );
  }

  private tomorrow(): Date {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    date.setHours(0, 0, 0, 0);
    return date;
  }
}
