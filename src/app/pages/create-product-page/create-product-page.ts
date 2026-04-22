import { Component, inject, OnInit, signal } from '@angular/core';
import { CreateProduct, ProductsService } from '../../services/product.service';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Card } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { PanelModule } from 'primeng/panel';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';
import { ActivatedRoute, RouterLink } from '@angular/router';

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
  localizations: FormArray<LocalizationForm>;
  images: FormArray<ProductImageForm>;
}>;

@Component({
  selector: 'app-create-product-page',
  imports: [CommonModule, ReactiveFormsModule, Card, InputTextModule, InputNumberModule, PanelModule, ButtonModule, TextareaModule, RouterLink],
  templateUrl: './create-product-page.html',
  styleUrl: './create-product-page.sass',
})
export class CreateProductPage implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private productsService = inject(ProductsService);

  readonly maxLocalizations = 20;
  readonly maxImages = 20;

  id: string | null = null;
  isEditMode = false;

  isLoading = signal(false);
  errorMessage = signal('');

  form: ProductForm = this.fb.group({
    sku: this.fb.nonNullable.control('', [Validators.required]),
    ean: this.fb.nonNullable.control('', [Validators.required]),
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

    const payload: CreateProduct = {
      sku: this.form.controls.sku.getRawValue(),
      ean: this.form.controls.ean.getRawValue(),
      price: this.form.controls.price.getRawValue()!,
      localizations: this.localizations.getRawValue(),
      images: this.images.getRawValue()
    };

    this.productsService.createProduct(payload).subscribe({
      next: (payload) => {
        this.isLoading.set(false);
      },
      error: (error) => {
        console.log(error);
        this.isLoading.set(false);
      }
    })
  }
}