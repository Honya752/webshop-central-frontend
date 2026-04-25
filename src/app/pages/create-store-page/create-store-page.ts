import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Card } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CreateWholesaler, UpdateWholesaler, WholesalersService } from '../../services/wholesalers.service';
import { CreateStore, StoresService, UpdateStore } from '../../services/stores.service';

@Component({
  selector: 'app-create-store-page',
  imports: [CommonModule, ReactiveFormsModule, Card, InputTextModule, ButtonModule, RouterLink, SelectModule, ConfirmDialogModule, ToastModule,],
  providers: [MessageService, ConfirmationService],
  templateUrl: './create-store-page.html',
  styleUrl: './create-store-page.sass',
})
export class CreateStorePage implements OnInit {
  private readonly storesService = inject(StoresService);
  private readonly messageService = inject(MessageService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);

  id: string | null = null;
  isEditMode = false;

  isLoading = signal(false);
  errorMessage = signal('');

  form = this.fb.group({
    name: this.fb.nonNullable.control('', [Validators.required]),
    slug: this.fb.nonNullable.control('', [Validators.required]),
    region: this.fb.nonNullable.control('', [Validators.required]),
    baseUrl: this.fb.nonNullable.control('', [Validators.required]),
    integrationType: this.fb.nonNullable.control('', [Validators.required]),
    integrationVer: this.fb.nonNullable.control('', [Validators.required]),
  });

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.id;

    if (this.isEditMode && this.id) {

      this.storesService.getStoreDetails(this.id).subscribe({
        next: (store) => {
          this.form.patchValue({
            name: store.name,
            slug: store.slug,
            region: store.region,
            baseUrl: store.baseUrl,
            integrationType: store.integrationType,
            integrationVer: store.integrationVer
          })
        }
      })
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    if (this.isEditMode && this.id) {
      const payload: UpdateStore = {
        ...(raw.name ? { name: raw.name } : {}),
        ...(raw.slug ? { slug: raw.slug } : {}),
        ...(raw.region ? { region: raw.region } : {}),
        ...(raw.baseUrl ? { baseUrl: raw.baseUrl } : {}),
        ...(raw.integrationType ? { integrationType: raw.integrationType } : {}),
        ...(raw.integrationVer ? { integrationVer: raw.integrationVer } : {}),
      }

      this.storesService.updateStore(payload, this.id).subscribe({
        next: (store) => {
          this.isLoading.set(false)
          this.messageService.add({
            severity: 'success',
            summary: 'Store updated',
            detail: `${store.name} updated successfully`,
          });
        }, error: (error) => {
          const serverError = error?.error?.message;

          if (typeof (serverError) === 'string') {
            this.errorMessage.set(serverError)
          }

          if (serverError) {
            this.applyBackendErrors(serverError);
          }

          this.isLoading.set(false);
        },
      })
    }
    else {
      const payload: CreateStore = {
        name: raw.name,
        slug: raw.slug,
        region: raw.region,
        baseUrl: raw.baseUrl,
        integrationType: raw.integrationType,
        integrationVer: raw.integrationVer
      }

      this.storesService.createStore(payload).subscribe({
        next: (store) => {
          this.isLoading.set(false)
          this.messageService.add({
            severity: 'success',
            summary: 'Store created',
            detail: `${store.name} created successfully`,
          });
        }, error: (error) => {
          const serverError = error?.error?.message;

          if (typeof (serverError) === 'string') {
            this.errorMessage.set(serverError)
          }

          if (serverError) {
            this.applyBackendErrors(serverError);
          }

          this.isLoading.set(false);
        },
      })
    }
  }
  applyBackendErrors(errors: Record<string, string[]>) {
    Object.keys(errors).forEach((field) => {
      const control = this.form.get(field);

      if (control) {
        control.setErrors({
          server: errors[field][0],
        });
      }
    });
  }

  integrations = [
    { label: "Woocommerce", value: "WOOCOMMERCE" },
    { label: "Shopify", value: "SHOPIFY" },
  ];

  getFlagEmoji(region: string): string {
    return region
      .toUpperCase()
      .replace(/./g, char =>
        String.fromCodePoint(127397 + char.charCodeAt(0))
      );
  }
}
