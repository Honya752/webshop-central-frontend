import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Card } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ActivatedRoute, Router } from '@angular/router';
import { applyServerErrors } from '../../utils/form-errors';
import { getApiErrorMessage } from '../../utils/api-error';
import { WholesalersService } from '../../services/wholesalers.service';
import { CreateWholesaler, UpdateWholesaler } from '../../types/wholesaler';
import { WholesalerIntegrationType, WholesalerOrderMode } from '../../types/enums';

import { CURRENCY_OPTIONS, DEFAULT_CURRENCY } from '../../utils/currencies';
@Component({
  selector: 'app-create-wholesaler-page',
  imports: [CommonModule, ReactiveFormsModule, Card, InputTextModule, ButtonModule, SelectModule, ConfirmDialogModule,],
  providers: [ConfirmationService],
  templateUrl: './create-wholesaler-page.html',
  styleUrl: './create-wholesaler-page.sass',
})
export class CreateWholesalerPage implements OnInit {
  private readonly wholesalersService = inject(WholesalersService);
  private readonly messageService = inject(MessageService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  id: string | null = null;
  isEditMode = false;

  isLoading = signal(false);
  errorMessage = signal('');

  form = this.fb.group({
    name: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(3)]),
    baseUrl: this.fb.nonNullable.control('', [Validators.required]),
    integrationType: this.fb.control<WholesalerIntegrationType | null>(null, [Validators.required]),
    currency: this.fb.nonNullable.control(DEFAULT_CURRENCY, [Validators.required]),
    orderMode: this.fb.nonNullable.control<WholesalerOrderMode>('AUTOMATIC', [Validators.required]),
    orderDelayMinutes: this.fb.nonNullable.control(15, [Validators.required, Validators.min(0), Validators.max(1440)]),
  });

  readonly currencies = CURRENCY_OPTIONS;

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.id;

    if (this.isEditMode && this.id) {

      this.wholesalersService.getWholesalerDetail(this.id).subscribe({
        next: (wholesaler) => {
          this.form.patchValue({
            name: wholesaler.name,
            baseUrl: wholesaler.baseUrl,
            integrationType: wholesaler.integrationType,
            currency: wholesaler.currency,
            orderMode: wholesaler.orderMode,
            orderDelayMinutes: wholesaler.orderDelayMinutes,
          });
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: getApiErrorMessage(error, 'Failed to load the wholesaler!'),
          });
        },
      });
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
      const payload: UpdateWholesaler = {
        ...(raw.name ? { name: raw.name } : {}),
        ...(raw.baseUrl ? { baseUrl: raw.baseUrl } : {}),
        ...(raw.integrationType ? { integrationType: raw.integrationType } : {}),
        currency: raw.currency,
        orderMode: raw.orderMode,
        orderDelayMinutes: raw.orderDelayMinutes,
      }

      this.wholesalersService.updateWholesaler(payload, this.id).subscribe({
        next: (wholesaler) => {
          this.isLoading.set(false);
          this.router.navigate(['/wholesaler', wholesaler.id]);
          this.messageService.add({
            severity: 'success',
            summary: 'Wholesaler updated',
            detail: `${wholesaler.name} updated successfully`,
          });
        },
        error: (error) => {
          this.errorMessage.set(applyServerErrors(this.form, error, 'Failed to update the wholesaler'));
          this.isLoading.set(false);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: this.errorMessage() });
        },
      })
    }
    else {
      const payload: CreateWholesaler = {
        name: raw.name,
        baseUrl: raw.baseUrl,
        integrationType: raw.integrationType!,
        currency: raw.currency,
        orderMode: raw.orderMode,
        orderDelayMinutes: raw.orderDelayMinutes,
      };

      this.wholesalersService.createWholesaler(payload).subscribe({
        next: (wholesaler) => {
          this.isLoading.set(false);
          this.router.navigate(['/wholesaler', wholesaler.id]);
          this.messageService.add({
            severity: 'success',
            summary: 'Wholesaler created',
            detail: `${wholesaler.name} created successfully`,
          });
        },
        error: (error) => {
          this.errorMessage.set(applyServerErrors(this.form, error, 'Failed to create the wholesaler'));
          this.isLoading.set(false);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: this.errorMessage() });
        },
      })
    }
  }

  readonly orderModes: { label: string; value: WholesalerOrderMode }[] = [
    { label: 'Automatic, after a waiting time', value: 'AUTOMATIC' },
    { label: 'Manual (Send now)', value: 'MANUAL' },
  ];

  integrations: { label: string; value: WholesalerIntegrationType }[] = [
    { label: "JSON integration", value: "JSON_INTEGRATION" },
    { label: "XML integration", value: "XML_INTEGRATION" },
  ]

}
