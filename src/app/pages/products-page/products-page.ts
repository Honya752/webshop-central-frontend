import { AfterViewInit, Component, ElementRef, inject, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { ProductsService } from '../../services/product.service';
import { Product, ProductSortBy } from '../../types/product';
import { SortOrder } from '../../types/api-response';
import { Card } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { AuthService } from '../../services/auth.service';
import { RouterLink } from "@angular/router";
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime } from 'rxjs';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';

type ProductFilterForm = FormGroup<{
  search: FormControl<string>;
  sortBy: FormControl<ProductSortBy>;
  sortOrder: FormControl<SortOrder>;
}>;

import { getApiErrorMessage } from '../../utils/api-error';
import { MoneyPipe } from '../../pipes/money.pipe';
@Component({
  selector: 'app-products-page',
  imports: [MoneyPipe, ConfirmDialogModule, Card, TableModule, ButtonModule, TagModule, RouterLink, ProgressSpinnerModule, IconFieldModule, InputIconModule, ReactiveFormsModule, SelectModule, InputTextModule],
  templateUrl: './products-page.html',
  providers: [ConfirmationService],
  styleUrl: './products-page.sass',
})
export class ProductsPage implements OnInit, AfterViewInit, OnDestroy {

  private readonly fb = inject(FormBuilder);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly productService = inject(ProductsService);
  readonly authService = inject(AuthService);

  products = signal<Product[]>([]);
  /** Number of all matching products (from the pagination meta). */
  readonly total = signal<number | null>(null);

  page = signal(1);
  limit = 25;

  isLoading = signal(false);
  hasNextPage = signal(true);

  filterForm: ProductFilterForm = this.fb.group({
    search: this.fb.nonNullable.control<string>(''),
    sortBy: this.fb.nonNullable.control<ProductSortBy>('createdAt'),
    sortOrder: this.fb.nonNullable.control<SortOrder>('desc')
  });

  private observer!: IntersectionObserver;

  @ViewChild('loadMoreTrigger', { static: true })
  loadMoreTrigger!: ElementRef;

  loadProducts(): void {
    if (this.isLoading() || !this.hasNextPage()) return;

    this.isLoading.set(true);

    const params = {
      page: this.page(),
      limit: this.limit,
      search: this.filterForm.controls.search.getRawValue(),
      sortBy: this.filterForm.controls.sortBy.getRawValue(),
      sortOrder: this.filterForm.controls.sortOrder.getRawValue()
    };

    this.productService.getProducts(params).subscribe({
      next: (payload) => {
        const { products, meta } = payload;

        this.products.update(prev => [...prev, ...products]);
        this.total.set(meta.total);
        this.hasNextPage.set(meta.pages > meta.page);
        this.page.update(p => p + 1);

        this.isLoading.set(false);
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: getApiErrorMessage(error, 'Failed to load products!'),
        });
        this.hasNextPage.set(false);
        this.isLoading.set(false);
      },
    })
  }

  deleteProduct(id: string) {
    this.isLoading.set(true);

    this.productService.deleteProduct(id).subscribe({
      next: () => {
        // Reset the flag first: loadProducts() does nothing while a request is running
        this.isLoading.set(false);
        this.resetAndReload();
        this.messageService.add({
          severity: 'success',
          summary: 'Deleted',
          detail: 'Product deleted successfully',
        });
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: getApiErrorMessage(error, 'Failed to delete product!'),
        });

        this.isLoading.set(false);
      }
    })
  }

  resetAndReload(): void {
    this.products.set([]);
    this.page.set(1);
    this.hasNextPage.set(true);

    this.loadProducts();
  }

  ngOnInit(): void {
    this.filterForm.valueChanges
      .pipe(debounceTime(300))
      .subscribe(() => this.resetAndReload());
    this.loadProducts();
  }

  ngAfterViewInit(): void {
    this.observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        this.loadProducts();
      }
    }, {
      rootMargin: '200px'
    });

    this.observer.observe(this.loadMoreTrigger.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  confirmDelete(event: Event, product: Product) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Are you sure you want to delete ${product.name}? Its images, localizations, wholesaler stocks and store mappings are deleted too`,
      header: 'Delete product',
      icon: 'pi pi-exclamation-triangle', rejectButtonProps: {
        label: 'Cancel',
        severity: 'secondary',
        outlined: true,
      },
      acceptButtonProps: {
        label: 'Delete',
        severity: 'danger',
      },
      accept: () => {
        this.deleteProduct(product.id);
      },
    });
  }


  sortByOptions: { label: string; value: ProductSortBy }[] = [
    { label: 'Creation Date', value: 'createdAt' },
    { label: 'Price', value: 'price' },
    { label: 'SKU', value: 'sku' },
    { label: 'EAN', value: 'ean' },
  ];

  sortOrderOptions = [
    { label: 'Ascending', value: 'asc' },
    { label: 'Descending', value: 'desc' }
  ];
}
