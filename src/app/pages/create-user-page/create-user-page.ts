import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CreateUser, UpdateUser, UsersService } from '../../services/users.service';
import { StoresService, StoreSummary } from '../../services/stores.service';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Card } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { PasswordModule } from 'primeng/password';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

@Component({
  selector: 'app-create-user-page',
  imports: [CommonModule, PasswordModule, ReactiveFormsModule, Card, InputTextModule, ButtonModule, RouterLink, SelectModule, ConfirmDialogModule, ToastModule,],
  providers: [MessageService, ConfirmationService],
  templateUrl: './create-user-page.html',
  styleUrl: './create-user-page.sass',
})
export class CreateUserPage implements OnInit {

  private readonly usersService = inject(UsersService);
  private readonly storesService = inject(StoresService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);

  id: string | null = null;
  isEditMode = false;

  isLoading = signal(false);
  errorMessage = signal('');

  stores = signal<StoreSummary[]>([]);

  form = this.fb.group({
    name: this.fb.nonNullable.control('', [Validators.required]),
    email: this.fb.nonNullable.control('', [Validators.required, Validators.email]),
    password: this.fb.control<string | null>(null),
    globalRole: this.fb.nonNullable.control('USER', [Validators.required]),
    storeId: this.fb.control<string | null>(null),
    storeRole: this.fb.control<string | null>(null),
  });

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.id;

    this.storesService.getStoreSummeries().subscribe({
      next: payload => {
        this.stores.set(payload);
        console.log(payload)
      }
    });

    if (this.isEditMode && this.id) {
      this.form.controls.password.setValidators([Validators.minLength(8)]);

      this.usersService.getUserData(this.id).subscribe({
        next: (user) => {
          console.log(user.storeMembership?.id)
          this.form.patchValue({
            name: user.name,
            email: user.email,
            globalRole: user.globalRole,
            storeId: user.storeMembership?.storeId,
            storeRole: user.storeMembership?.role
          })
        }
      })
    }
    else {
      this.form.controls.password.setValidators([
        Validators.required,
        Validators.minLength(6),
      ]);
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.isEditMode && this.id) {
      const raw = this.form.getRawValue();
      const payload: UpdateUser = {
        ...(raw.name ? { name: raw.name } : {}),
        ...(raw.email ? { email: raw.email } : {}),
        ...(raw.globalRole ? { globalRole: raw.globalRole } : {}),
        ...(raw.password ? { password: raw.password } : {}),
        storeMembership: raw.storeId
          ? {
            storeId: raw.storeId,
            ...(raw.storeRole ? { role: raw.storeRole } : {}),
          }
          : null,
      };

      console.log(payload);

      this.usersService.updateUser(payload, this.id).subscribe({
        next: user => {
          this.isLoading.set(false);
        },
        error: (error) => {
          const serverError = error?.error?.message;

          if (typeof (serverError) === 'string') {
            this.errorMessage.set(serverError)
          }

          if (serverError) {
            this.applyBackendErrors(serverError);
          }

          this.isLoading.set(false);
        },
      });
    }
    else {
      const raw = this.form.getRawValue();

      const payload: CreateUser = {
        name: raw.name,
        email: raw.email,
        password: raw.password!,
        globalRole: raw.globalRole,
        ...(raw.storeId && {
          storeMembership: {
            storeId: raw.storeId,
            ...(raw.storeRole ? { role: raw.storeRole } : { storeMembership: null }),
          },
        }),
      };

      console.log(payload);

      this.usersService.createUser(payload).subscribe({
        next: user => {
          this.isLoading.set(false);
        },
        error: (error) => {
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

  roleOptions = [
    { label: 'Administrator', value: 'SYSADMIN' },
    { label: 'Moderator', value: 'MODERATOR' },
    { label: 'User', value: 'USER' },
  ];

  storeOptions = computed(() =>
    this.stores().map(store => ({
      label: store.name,
      value: store.id,
    }))
  );

  storeRoleOptions = [
    { label: 'Administrator', value: 'ADMIN' },
    { label: 'Moderator', value: 'MODERATOR' },
    { label: 'Viewer', value: 'VIEWER' },
  ];
}
