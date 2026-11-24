import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { applyServerErrors } from '../../utils/form-errors';
import { Router, RouterLink } from '@angular/router';
import { passwordMatchValidator } from '../../validators/password-match';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    CardModule],
  templateUrl: './register-page.html',
  styleUrl: './register-page.sass',
})
export class RegisterPage {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router)

  isSubmitting = signal(false);
  errorMessage = signal('');

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    name: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    passwordConfirm: ['', [Validators.required]]
  },
    {
      validators: passwordMatchValidator,
    }
  );

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const { passwordConfirm, ...payload } = this.form.getRawValue();

    this.authService.register(payload).subscribe({
      next: () => {
        this.router.navigateByUrl('/dashboard');
      },
      error: (error) => {
        this.errorMessage.set(applyServerErrors(this.form, error, 'Registration failed'));
        this.isSubmitting.set(false);
      },
      complete: () => {
        this.isSubmitting.set(false);
      }
    })
  }


  get name() { return this.form.controls.name }
  get email() { return this.form.controls.email }
  get password() { return this.form.controls.password }
  get passwordConfirm() { return this.form.controls.passwordConfirm }

}
