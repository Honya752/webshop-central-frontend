import { Component, inject, OnInit, signal } from '@angular/core';
import { ProductsService } from '../../services/product.service';
import { CreateProduct, UpdateProduct } from '../../types/product';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Card } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { PanelModule } from 'primeng/panel';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';
import { ActivatedRoute, Router } from '@angular/router';
import { applyServerErrors } from '../../utils/form-errors';
import { getApiErrorMessage } from '../../utils/api-error';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ImageModule } from 'primeng/image';
import { SelectModule } from 'primeng/select';

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
  currency: FormControl<string>;
  brand: FormControl<string>;
  category: FormControl<string>;
  localizations: FormArray<LocalizationForm>;
  images: FormArray<ProductImageForm>;
}>;

import { CURRENCY_OPTIONS, DEFAULT_CURRENCY } from '../../utils/currencies';
@Component({
  selector: 'app-create-product-page',
  imports: [CommonModule, ReactiveFormsModule, Card, ImageModule, InputTextModule, InputNumberModule, PanelModule, ButtonModule, TextareaModule, SelectModule],
  providers: [ConfirmationService],
  templateUrl: './create-product-page.html',
  styleUrl: './create-product-page.sass',
})
export class CreateProductPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productsService = inject(ProductsService);
  private readonly messageService = inject(MessageService);

  readonly maxLocalizations = 20;
  readonly maxImages = 20;
  readonly currencies = CURRENCY_OPTIONS;

  id: string | null = null;
  isEditMode = false;

  isLoading = signal(false);
  errorMessage = signal('');

  form: ProductForm = this.fb.group({
    sku: this.fb.nonNullable.control('', [Validators.required]),
    ean: this.fb.nonNullable.control('', [Validators.required]),
    brand: this.fb.nonNullable.control('', [Validators.required]),
    category: this.fb.nonNullable.control('', [Validators.required]),
    currency: this.fb.nonNullable.control(DEFAULT_CURRENCY, [Validators.required]),
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
            currency: product.currency,
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
          });
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: getApiErrorMessage(error, 'Failed to load the product!'),
          });
        },
      });
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

    this.isLoading.set(true);
    this.errorMessage.set('');

    if (this.isEditMode && this.id) {
      const payload: UpdateProduct = {
        sku: this.form.controls.sku.getRawValue(),
        ean: this.form.controls.ean.getRawValue(),
        brand: this.form.controls.brand.getRawValue(),
        category: this.form.controls.category.getRawValue(),
        price: this.form.controls.price.getRawValue()!,
        currency: this.form.controls.currency.getRawValue(),
        localizations: this.localizations.getRawValue(),
        images: this.images.getRawValue()
      };

      this.productsService.updateProduct(payload, this.id).subscribe({
        next: (product) => {
          this.isLoading.set(false);
          this.router.navigate(['/product', product.id]);
          this.messageService.add({
            severity: 'success',
            summary: 'Product updated',
            detail: `Product #${product.sku} updated successfully`,
          });
        },
        error: (error) => {
          this.errorMessage.set(applyServerErrors(this.form, error, 'Failed to update the product'));
          this.isLoading.set(false);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: this.errorMessage() });
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
        currency: this.form.controls.currency.getRawValue(),
        localizations: this.localizations.getRawValue(),
        images: this.images.getRawValue()
      };

      this.productsService.createProduct(payload).subscribe({
        next: (product) => {
          this.isLoading.set(false);
          this.router.navigate(['/product', product.id]);
          this.messageService.add({
            severity: 'success',
            summary: 'Product created',
            detail: `Product #${product.sku} created successfully`,
          });
        },

        error: (error) => {
          this.errorMessage.set(applyServerErrors(this.form, error, 'Failed to create the product'));
          this.isLoading.set(false);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: this.errorMessage() });
        },
      })
    }
  }


  getFlagEmoji(region: string): string {
    return region
      .toUpperCase()
      .replace(/./g, char =>
        String.fromCodePoint(127397 + char.charCodeAt(0))
      );
  }
}