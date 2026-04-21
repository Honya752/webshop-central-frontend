import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { Product, ProductsService } from '../../services/product.service';
import { Card } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { AuthService } from '../../services/auth.service';
import { RouterLink } from "@angular/router";

@Component({
  selector: 'app-products-page',
  imports: [Card, TableModule, ButtonModule, TagModule, RouterLink],
  templateUrl: './products-page.html',
  styleUrl: './products-page.sass',
})
export class ProductsPage implements OnInit, AfterViewInit, OnDestroy {

  products = signal<Product[]>([]);

  page = signal(1);
  limit = 20;

  isLoading = signal(false);
  hasNextPage = signal(true);

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

    this.productService.getProducts(this.page(), this.limit).subscribe({
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

}
