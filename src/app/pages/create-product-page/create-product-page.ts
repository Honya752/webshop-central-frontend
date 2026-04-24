import { Component, inject, OnInit, signal } from '@angular/core';
import { CreateProduct, ProductsService, UpdateProduct } from '../../services/product.service';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Card } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { PanelModule } from 'primeng/panel';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ImageModule } from 'primeng/image';

type LocalizationForm = FormGroup<{
  region: FormControl<string>;
  name: FormControl<string>;
  description: FormControl<string>;
}>;

type ProductImageForm = FormGroup<{
  url: FormControl<string>;
  alt: FormControl<string>;
}>;

type ProductForm = FormGroup<{
  sku: FormControl<string>;
  ean: FormControl<string>;
  price: FormControl<number | null>;
  brand: FormControl<string>;
  category: FormControl<string>;
  localizations: FormArray<LocalizationForm>;
  images: FormArray<ProductImageForm>;
}>;

@Component({
  selector: 'app-create-product-page',
  imports: [CommonModule, ReactiveFormsModule, Card, ImageModule, InputTextModule, InputNumberModule, PanelModule, ButtonModule, TextareaModule, RouterLink, ToastModule],
  providers: [MessageService, ConfirmationService],
  templateUrl: './create-product-page.html',
  styleUrl: './create-product-page.sass',
})
export class CreateProductPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly productsService = inject(ProductsService);
  private readonly messageService = inject(MessageService);

  readonly maxLocalizations = 20;
  readonly maxImages = 20;

  id: string | null = null;
  isEditMode = false;

  isLoading = signal(false);
  errorMessage = signal('');

  form: ProductForm = this.fb.group({
    sku: this.fb.nonNullable.control('', [Validators.required]),
    ean: this.fb.nonNullable.control('', [Validators.required]),
    brand: this.fb.nonNullable.control('', [Validators.required]),
    category: this.fb.nonNullable.control('', [Validators.required]),
    price: this.fb.control<number | null>(null, [
      Validators.required,
      Validators.min(0)
    ]),
    localizations: this.fb.array<LocalizationForm>([]),
    images: this.fb.array<ProductImageForm>([])
  });

  get localizations(): FormArray<LocalizationForm> {
    return this.form.controls.localizations;
  }

  get images(): FormArray<ProductImageForm> {
    return this.form.controls.images;
  }

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.id;

    if (this.isEditMode && this.id) {
      this.productsService.getAllProductData(this.id).subscribe({
        next: (product) => {
          this.form.patchValue({
            sku: product.sku,
            ean: product.ean,
            price: product.price,
            category: product.category,
            brand: product.brand
          });

          product.localizations.forEach((loc) => {
            const group = this.createLocalizationGroup();

            group.patchValue({
              region: loc.region,
              name: loc.name,
              description: loc.description,
            });

            this.localizations.push(group);
          });

          product.images.forEach((img) => {
            const group = this.createImageGroup();

            group.patchValue({
              url: img.url,
              alt: img.alt,
            });

            this.images.push(group);
          })
        }
      })
    }
    else {
      this.localizations.push(this.createLocalizationGroup());
      this.images.push(this.createImageGroup());
    }
  }

  createLocalizationGroup(): LocalizationForm {
    return this.fb.group({
      region: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(10)]),
      name: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(255)]),
      description: this.fb.nonNullable.control('', [Validators.required])
    });
  }

  createImageGroup(): ProductImageForm {
    return this.fb.group({
      url: this.fb.nonNullable.control('', [Validators.required]),
      alt: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(255)])
    });
  }

  addLocalization(): void {
    if (this.localizations.length >= this.maxLocalizations) return;
    this.localizations.push(this.createLocalizationGroup());
  }

  removeLocalization(index: number): void {
    if (this.localizations.length <= 1) return;
    this.localizations.removeAt(index);
  }

  addImage(): void {
    if (this.images.length >= this.maxImages) return;
    this.images.push(this.createImageGroup());
  }

  removeImage(index: number): void {
    if (this.images.length <= 1) return;
    this.images.removeAt(index);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.isEditMode && this.id) {
      const payload: UpdateProduct = {
        sku: this.form.controls.sku.getRawValue(),
        ean: this.form.controls.ean.getRawValue(),
        brand: this.form.controls.brand.getRawValue(),
        category: this.form.controls.category.getRawValue(),
        price: this.form.controls.price.getRawValue()!,
        localizations: this.localizations.getRawValue(),
        images: this.images.getRawValue()
      };

      console.log(payload)

      this.productsService.updateProduct(payload, this.id).subscribe({
        next: (product) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Product updated',
            detail: `Product #${product.sku} updated successfully`,
          });
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
    else {
      const payload: CreateProduct = {
        sku: this.form.controls.sku.getRawValue(),
        ean: this.form.controls.ean.getRawValue(),
        brand: this.form.controls.brand.getRawValue(),
        category: this.form.controls.category.getRawValue(),
        price: this.form.controls.price.getRawValue()!,
        localizations: this.localizations.getRawValue(),
        images: this.images.getRawValue()
      };

      this.productsService.createProduct(payload).subscribe({
        next: (product) => {
          this.isLoading.set(false);
          this.messageService.add({
            severity: 'success',
            summary: 'Product created',
            detail: `Product #${product.sku} created successfully`,
          });
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

  getFlagEmoji(region: string): string {
    return region
      .toUpperCase()
      .replace(/./g, char =>
        String.fromCodePoint(127397 + char.charCodeAt(0))
      );
  }
}