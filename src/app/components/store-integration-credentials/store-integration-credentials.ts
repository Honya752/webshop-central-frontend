import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { TagModule } from 'primeng/tag';
import { MessageModule } from 'primeng/message';
import { environment } from '../../../environment';
import { StoresService } from '../../services/stores.service';
import { SetStoreCredentials, StoreCredentialsStatus } from '../../types/integration';
import { IntegrationType } from '../../types/enums';
import { getApiErrorMessage } from '../../utils/api-error';

/** Credentials this system uses to call the webshop, and the webhook settings of the store. */
@Component({
  selector: 'app-store-integration-credentials',
  imports: [DatePipe, ReactiveFormsModule, ButtonModule, InputTextModule, PasswordModule, TagModule, MessageModule],
  templateUrl: './store-integration-credentials.html',
})
export class StoreIntegrationCredentials implements OnInit {
  private readonly storesService = inject(StoresService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly fb = inject(FormBuilder);

  readonly storeId = input.required<string>();
  readonly integrationType = input<IntegrationType>();

  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly status = signal<StoreCredentialsStatus | null>(null);
  /** Generated webhook secret, only returned once by the server. */
  readonly generatedWebhookSecret = signal<string | null>(null);

  readonly isShopify = computed(() => this.integrationType() === 'SHOPIFY');
  readonly webhookUrl = computed(() => {
    const path = this.status()?.webhookPath;
    return path ? `${environment.apiUrl}${path}` : '';
  });

  readonly form = this.fb.nonNullable.group({
    apiKey: ['', [Validators.maxLength(500)]],
    apiSecret: ['', [Validators.required, Validators.maxLength(500)]],
    webhookSecret: ['', [Validators.minLength(16), Validators.maxLength(500)]],
  });

  ngOnInit(): void {
    this.loadStatus();
  }

  loadStatus() {
    this.isLoading.set(true);
    this.loadError.set(null);

    this.storesService.getIntegrationCredentials(this.storeId()).subscribe({
      next: status => {
        this.status.set(status);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.loadError.set(getApiErrorMessage(error, 'Failed to load the webshop credentials'));
        this.isLoading.set(false);
      }
    });
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const payload: SetStoreCredentials = {
      apiSecret: raw.apiSecret,
      ...(raw.apiKey && !this.isShopify() ? { apiKey: raw.apiKey } : {}),
      ...(raw.webhookSecret ? { webhookSecret: raw.webhookSecret } : {}),
    };

    this.isSaving.set(true);

    this.storesService.setIntegrationCredentials(this.storeId(), payload).subscribe({
      next: result => {
        const { webhookSecret, ...status } = result;
        this.status.set(status);
        this.generatedWebhookSecret.set(webhookSecret ?? null);
        this.form.reset();
        this.isSaving.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Credentials saved',
          detail: 'Webshop credentials saved successfully',
        });
      },
      error: (error) => {
        this.isSaving.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: getApiErrorMessage(error, 'Failed to save the webshop credentials!'),
        });
      }
    });
  }

  confirmDelete(event: Event) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Delete the credentials? Product sync and webhooks stop working for this store until new ones are set',
      header: 'Delete credentials',
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: {
        label: 'Cancel',
        severity: 'secondary',
        outlined: true,
      },
      acceptButtonProps: {
        label: 'Delete',
        severity: 'danger',
      },
      accept: () => this.deleteCredentials(),
    });
  }

  private deleteCredentials() {
    this.storesService.deleteIntegrationCredentials(this.storeId()).subscribe({
      next: () => {
        this.generatedWebhookSecret.set(null);
        this.messageService.add({
          severity: 'success',
          summary: 'Credentials deleted',
          detail: 'Webshop credentials deleted successfully',
        });
        this.loadStatus();
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: getApiErrorMessage(error, 'Failed to delete the webshop credentials!'),
        });
      }
    });
  }

  copy(value: string) {
    navigator.clipboard?.writeText(value).then(
      () => this.messageService.add({ severity: 'info', summary: 'Copied', detail: 'Copied to the clipboard' }),
      () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to copy to the clipboard' }),
    );
  }
}
