import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { UsersService } from '../../services/users.service';
import { StoresService } from '../../services/stores.service';
import { CreateUser, UpdateUser } from '../../types/user';
import { StoreSummary } from '../../types/store';
import { GlobalRole, StoreRole } from '../../types/enums';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
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
  imports: [CommonModule, PasswordModule, ReactiveFormsModule, Card, InputTextModule, ButtonModule, SelectModule, ConfirmDialogModule, ToastModule,],
  providers: [MessageService, ConfirmationService],
  templateUrl: './create-user-page.html',
  styleUrl: './create-user-page.sass',
})
export class CreateUserPage implements OnInit {

  private readonly usersService = inject(UsersService);
  private readonly storesService = inject(StoresService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly messageService = inject(MessageService);

  id: string | null = null;
  isEditMode = false;

  isLoading = signal(false);
  errorMessage = signal('');

  stores = signal<StoreSummary[]>([]);

  form = this.fb.group({
    name: this.fb.nonNullable.control('', [Validators.required]),
    email: this.fb.nonNullable.control('', [Validators.required, Validators.email]),
    password: this.fb.control<string | null>(null),
    globalRole: this.fb.nonNullable.control<GlobalRole>('USER', [Validators.required]),
    storeId: this.fb.control<string | null>(null),
    storeRole: this.fb.control<StoreRole | null>(null),
  });

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.id;

    this.storesService.getStoreSummaries().subscribe({
      next: payload => this.stores.set(payload),
    });

    if (this.isEditMode && this.id) {
      this.form.controls.password.setValidators([Validators.minLength(6)]);

      this.usersService.getUserData(this.id).subscribe({
        next: (user) => {
          this.form.patchValue({
            name: user.name,
            email: user.email,
            globalRole: user.globalRole,
            storeId: user.storeMembership?.storeId ?? null,
            storeRole: user.storeMembership?.role ?? null,
          });
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

    this.isLoading.set(true);
    this.errorMessage.set('');

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

      this.usersService.updateUser(payload, this.id).subscribe({
        next: user => {
          this.isLoading.set(false);
          this.messageService.add({
            severity: 'success',
            summary: 'User updated',
            detail: `${user.name} updated successfully`,
          });
        },
        error: (error) => {
          const serverError = error?.error?.message;

          if (typeof serverError === 'string') {
            this.errorMessage.set(serverError);
          } else if (serverError && typeof serverError === 'object') {
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
        ...(raw.storeId
          ? {
            storeMembership: {
              storeId: raw.storeId,
              ...(raw.storeRole ? { role: raw.storeRole } : {}),
            },
          }
          : {}),
      };

      this.usersService.createUser(payload).subscribe({
        next: user => {
          this.isLoading.set(false);
          this.messageService.add({
            severity: 'success',
            summary: 'User created',
            detail: `${user.name} created successfully`,
          });
        },
        error: (error) => {
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

  roleOptions: { label: string; value: GlobalRole }[] = [
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

  storeRoleOptions: { label: string; value: StoreRole }[] = [
    { label: 'Administrator', value: 'ADMIN' },
    { label: 'Moderator', value: 'MODERATOR' },
    { label: 'Viewer', value: 'VIEWER' },
  ];
}
