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

@Component({
  selector: 'app-create-wholesaler-page',
  imports: [CommonModule, ReactiveFormsModule, Card, InputTextModule, ButtonModule, RouterLink, SelectModule, ConfirmDialogModule, ToastModule,],
  providers: [MessageService, ConfirmationService],
  templateUrl: './create-wholesaler-page.html',
  styleUrl: './create-wholesaler-page.sass',
})
export class CreateWholesalerPage implements OnInit {
  private readonly wholesalersService = inject(WholesalersService);
  private readonly messageService = inject(MessageService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);

  id: string | null = null;
  isEditMode = false;

  isLoading = signal(false);
  errorMessage = signal('');

  form = this.fb.group({
    name: this.fb.nonNullable.control('', [Validators.required]),
    baseUrl: this.fb.nonNullable.control('', [Validators.required]),
    integrationType: this.fb.nonNullable.control('', [Validators.required]),
  });

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.id;

    if (this.isEditMode && this.id) {

      this.wholesalersService.getWholesalerDetail(this.id).subscribe({
        next: (wholesaler) => {
          this.form.patchValue({
            name: wholesaler.name,
            baseUrl: wholesaler.baseUrl,
            integrationType: wholesaler.integrationType
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
      const payload: UpdateWholesaler = {
        ...(raw.name ? { name: raw.name } : {}),
        ...(raw.baseUrl ? { baseUrl: raw.baseUrl } : {}),
        ...(raw.integrationType ? { integrationType: raw.integrationType } : {}),
      }

      this.wholesalersService.updateWholesaler(payload, this.id).subscribe({
        next: (wholesaler) => {
          this.isLoading.set(false)
          this.messageService.add({
            severity: 'success',
            summary: 'Wholesaler updated',
            detail: `${wholesaler.name} updated successfully`,
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
      const payload: CreateWholesaler = {
        name: raw.name,
        baseUrl: raw.baseUrl,
        integrationType: raw.integrationType
      }

      this.wholesalersService.createWholesaler(payload).subscribe({
        next: (wholesaler) => {
          this.isLoading.set(false)
          this.messageService.add({
            severity: 'success',
            summary: 'Wholesaler created',
            detail: `${wholesaler.name} created successfully`,
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
    { label: "Example Integration", value: "EXAMPLEWHOLESALER" },
  ]

}
