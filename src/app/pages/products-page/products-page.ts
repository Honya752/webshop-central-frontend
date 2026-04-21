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

type ProductFilterForm = FormGroup<{
  search: FormControl<string>;
  sortBy: FormControl<'name' | 'price' | 'createdAt'>;
  sortOrder: FormControl<'asc' | 'desc'>;
}>;

@Component({
  selector: 'app-products-page',
  imports: [Card, TableModule, ButtonModule, TagModule, RouterLink, ProgressSpinnerModule, InputGroupModule, ReactiveFormsModule, SelectModule, InputTextModule],
  templateUrl: './products-page.html',
  styleUrl: './products-page.sass',
})
export class ProductsPage implements OnInit, AfterViewInit, OnDestroy {

  private fb = inject(FormBuilder);

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
    private productService: ProductsService,
    private authService: AuthService
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
        console.log(payload);
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
