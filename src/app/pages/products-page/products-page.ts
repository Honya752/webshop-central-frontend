import { AfterViewInit, Component, ElementRef, inject, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { Product, ProductsService } from '../../services/product.service';
import { Card } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { AuthService } from '../../services/auth.service';
import { RouterLink } from "@angular/router";
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime } from 'rxjs';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DecimalPipe } from '@angular/common';

type ProductFilterForm = FormGroup<{
  search: FormControl<string>;
  sortBy: FormControl<'name' | 'price' | 'createdAt'>;
  sortOrder: FormControl<'asc' | 'desc'>;
}>;

@Component({
  selector: 'app-products-page',
  imports: [ConfirmDialogModule, DecimalPipe, ToastModule, Card, TableModule, ButtonModule, TagModule, RouterLink, ProgressSpinnerModule, InputGroupModule, ReactiveFormsModule, SelectModule, InputTextModule],
  templateUrl: './products-page.html',
  providers: [MessageService, ConfirmationService],
  styleUrl: './products-page.sass',
})
export class ProductsPage implements OnInit, AfterViewInit, OnDestroy {

  private readonly fb = inject(FormBuilder);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly productService = inject(ProductsService);
  private readonly authService = inject(AuthService);

  products = signal<Product[]>([]);

  page = signal(1);
  limit = 20;

  isLoading = signal(false);
  hasNextPage = signal(true);

  filterForm: ProductFilterForm = this.fb.group({
    search: this.fb.nonNullable.control<string>(''),
    sortBy: this.fb.nonNullable.control<'name' | 'price' | 'createdAt'>('createdAt'),
    sortOrder: this.fb.nonNullable.control<'asc' | 'desc'>('desc')
  });

  private observer!: IntersectionObserver;

  @ViewChild('loadMoreTrigger', { static: true })
  loadMoreTrigger!: ElementRef;

  constructor(
  ) { }

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
        this.hasNextPage.set(meta.pages > meta.page);
        this.page.update(p => p + 1);

        this.isLoading.set(false);
      },
      error: (error) => {
        this.isLoading.set(false);
      },
    })
  }

  deleteProduct(id: string) {
    this.isLoading.set(true);

    this.productService.deleteProduct(id).subscribe({
      next: () => {
        this.resetAndReload();
        this.messageService.add({
          severity: 'success',
          summary: 'Deleted',
          detail: 'Product deleted successfully',
        });

        this.isLoading.set(false);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to delete product',
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
      .subscribe(values => {
        this.resetAndReload()
      });
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

  confirmDelete(event: Event, id: string) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Are you sure you want to delete this product?',
      header: 'Delete confirmation',
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
        this.deleteProduct(id);
      },
    });
  }

  get Role() {
    return this.authService.currentUser()?.globalRole;
  }

  sortByOptions = [
    { label: 'Name', value: 'name' },
    { label: 'Price', value: 'price' },
    { label: 'Creation Date', value: 'createdAt' }
  ];

  sortOrderOptions = [
    { label: 'Ascending', value: 'asc' },
    { label: 'Descending', value: 'desc' }
  ];
}
