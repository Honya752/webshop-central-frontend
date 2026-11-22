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
import { ActivatedRoute } from '@angular/router';
import { StoresService } from '../../services/stores.service';
import { CreateStore, UpdateStore } from '../../types/store';
import { IntegrationType } from '../../types/enums';

@Component({
  selector: 'app-create-store-page',
  imports: [CommonModule, ReactiveFormsModule, Card, InputTextModule, ButtonModule, SelectModule, ConfirmDialogModule, ToastModule,],
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
    name: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(3)]),
    slug: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(3)]),
    region: this.fb.nonNullable.control('', [Validators.required]),
    baseUrl: this.fb.nonNullable.control('', [Validators.required]),
    integrationType: this.fb.control<IntegrationType | null>(null, [Validators.required]),
  });

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.id;

    if (this.isEditMode && this.id) {
      // The slug is the webhook identifier of the store, it cannot be changed after creation
      this.form.controls.slug.disable();

      this.storesService.getStoreDetails(this.id).subscribe({
        next: (store) => {
          this.form.patchValue({
            name: store.name,
            slug: store.slug,
            region: store.region,
            baseUrl: store.baseUrl,
            integrationType: store.integrationType,
          });
        }
      })
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const raw = this.form.getRawValue();
    if (this.isEditMode && this.id) {
      const payload: UpdateStore = {
        ...(raw.name ? { name: raw.name } : {}),
        ...(raw.region ? { region: raw.region } : {}),
        ...(raw.baseUrl ? { baseUrl: raw.baseUrl } : {}),
        ...(raw.integrationType ? { integrationType: raw.integrationType } : {}),
      };

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

          if (typeof serverError === 'string') {
            this.errorMessage.set(serverError);
          } else if (serverError && typeof serverError === 'object') {
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
        integrationType: raw.integrationType!,
      };

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

          if (typeof serverError === 'string') {
            this.errorMessage.set(serverError);
          } else if (serverError && typeof serverError === 'object') {
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

  integrations: { label: string; value: IntegrationType }[] = [
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
