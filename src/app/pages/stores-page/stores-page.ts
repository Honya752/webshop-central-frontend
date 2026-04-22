import { AfterViewInit, Component, ElementRef, inject, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { Store, StoresService } from '../../services/stores.service';
import { Card } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { RouterLink } from '@angular/router';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
  selector: 'app-stores-page',
  imports: [Card, TableModule, ButtonModule, TagModule, RouterLink, ProgressSpinnerModule],
  templateUrl: './stores-page.html',
  styleUrl: './stores-page.sass',
})
export class StoresPage implements OnInit, AfterViewInit, OnDestroy {

  private readonly storesService = inject(StoresService);

  stores = signal<Store[]>([]);
  isLoading = signal(false);
  hasNextPage = signal(true);
  page = signal(1);
  limit = 5;

  private observer!: IntersectionObserver;

  @ViewChild('loadMoreTrigger', { static: true })
  loadMoreTrigger!: ElementRef;

  loadStores() {
    if (this.isLoading() || !this.hasNextPage()) return;

    this.isLoading.set(true);

    this.storesService.getStores(this.page(), this.limit).subscribe({
      next: (payload) => {

        const { stores, meta } = payload;
        this.stores.update(prev => [...prev, ...stores]);
        this.hasNextPage.set(meta.pages > meta.page);
        this.page.update(p => p + 1);

        this.isLoading.set(false);
      },
      error: (error) => {
        this.isLoading.set(false);
      },
    })
  }

  ngOnInit(): void {
    this.loadStores();
  }

  ngAfterViewInit(): void {
    this.observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        this.loadStores();
      }
    }, {
      rootMargin: '200px'
    });

    this.observer.observe(this.loadMoreTrigger.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  getFlagEmoji(region: string): string {
    return region
      .toUpperCase()
      .replace(/./g, char =>
        String.fromCodePoint(127397 + char.charCodeAt(0))
      );
  }

}
