import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { UsersService } from '../../services/users.service';
import { StoresService } from '../../services/stores.service';
import { CreateUser, UpdateUser } from '../../types/user';
import { StoreSummary } from '../../types/store';
import { GlobalRole, StoreRole } from '../../types/enums';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { UserAvatar } from '../../components/user-avatar/user-avatar';
import { applyServerErrors } from '../../utils/form-errors';
import { getApiErrorMessage } from '../../utils/api-error';
import { CommonModule } from '@angular/common';
import { Card } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { PasswordModule } from 'primeng/password';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

@Component({
  selector: 'app-create-user-page',
  imports: [RouterLink, UserAvatar, CommonModule, PasswordModule, ReactiveFormsModule, Card, InputTextModule, ButtonModule, SelectModule, ConfirmDialogModule,],
  providers: [ConfirmationService],
  templateUrl: './create-user-page.html',
  styleUrl: './create-user-page.sass',
})
export class CreateUserPage implements OnInit {

  private readonly usersService = inject(UsersService);
  private readonly storesService = inject(StoresService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);

  id: string | null = null;
  isEditMode = false;

  isLoading = signal(false);
  errorMessage = signal('');

  stores = signal<StoreSummary[]>([]);

  private readonly roleHints: Record<GlobalRole, string> = {
    USER: 'Sees only the store they belong to',
    MODERATOR: 'Can also create and delete products',
    SYSADMIN: 'Full access to every store, user, wholesaler and setting',
  };

  private readonly storeRoleHints: Record<StoreRole, string> = {
    VIEWER: 'Can see the orders, products and statistics of the store',
    MODERATOR: 'Can also change order statuses, sync products and see the jobs',
    ADMIN: 'Can also edit the store and manage its webshop and API keys',
  };

  readonly roleHint = signal(this.roleHints.USER);
  readonly storeRoleHint = signal(this.storeRoleHints.VIEWER);

  form = this.fb.group({
    name: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(3)]),
    email: this.fb.nonNullable.control('', [Validators.required, Validators.email]),
    password: this.fb.control<string | null>(null),
    globalRole: this.fb.nonNullable.control<GlobalRole>('USER', [Validators.required]),
    storeId: this.fb.control<string | null>(null),
    storeRole: this.fb.control<StoreRole | null>(null),
  });

  ngOnInit(): void {
    this.form.controls.globalRole.valueChanges.subscribe(role => this.roleHint.set(this.roleHints[role] ?? ''));
    this.form.controls.storeRole.valueChanges.subscribe(role => this.storeRoleHint.set(this.storeRoleHints[role ?? 'VIEWER']));

    // The store role only means something with a store
    this.form.controls.storeId.valueChanges.subscribe(storeId => {
      if (storeId) this.form.controls.storeRole.enable({ emitEvent: false });
      else this.form.controls.storeRole.disable({ emitEvent: false });
    });
    this.form.controls.storeRole.disable({ emitEvent: false });

    this.id = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.id;

    this.storesService.getStoreSummaries().subscribe({
      next: payload => this.stores.set(payload),
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: getApiErrorMessage(error, 'Failed to load the stores!'),
        });
      },
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
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: getApiErrorMessage(error, 'Failed to load the user!'),
          });
        },
      });
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
          this.router.navigate(['/users']);
          this.messageService.add({
            severity: 'success',
            summary: 'User updated',
            detail: `${user.name} updated successfully`,
          });
        },
        error: (error) => {
          this.errorMessage.set(applyServerErrors(this.form, error, 'Failed to update the user'));
          this.isLoading.set(false);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: this.errorMessage() });
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
          this.router.navigate(['/users']);
          this.messageService.add({
            severity: 'success',
            summary: 'User created',
            detail: `${user.name} created successfully`,
          });
        },
        error: (error) => {
          this.errorMessage.set(applyServerErrors(this.form, error, 'Failed to create the user'));
          this.isLoading.set(false);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: this.errorMessage() });
        },
      })
    }
  }


  roleOptions: { label: string; value: GlobalRole }[] = [
    { label: 'User', value: 'USER' },
    { label: 'Moderator', value: 'MODERATOR' },
    { label: 'Administrator', value: 'SYSADMIN' },
  ];

  storeOptions = computed(() =>
    this.stores().map(store => ({
      label: store.name,
      value: store.id,
    }))
  );

  // Different from the system roles, so "Administrator" always means the system administrator
  storeRoleOptions: { label: string; value: StoreRole }[] = [
    { label: 'Viewer', value: 'VIEWER' },
    { label: 'Store moderator', value: 'MODERATOR' },
    { label: 'Store admin', value: 'ADMIN' },
  ];
}
