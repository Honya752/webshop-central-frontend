import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { Card } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { Wholesaler, WholesalersService } from '../../services/wholesalers.service';

@Component({
  selector: 'app-wholesalers-page',
  imports: [Card, TableModule, ButtonModule, TagModule, RouterLink, ProgressSpinnerModule],
  templateUrl: './wholesalers-page.html',
  styleUrl: './wholesalers-page.sass',
})
export class WholesalersPage implements OnInit {

  private readonly wholesalersService = inject(WholesalersService);

  wholesalers = signal<Wholesaler[]>([]);
  isLoading = signal(false);

  loadWholesaler() {
    if (this.isLoading()) return;
    this.isLoading.set(true);

    this.wholesalersService.listWholesalers().subscribe({
      next: (payload) => {
        this.wholesalers.set(payload);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.isLoading.set(false)
      }
    })
  }

  ngOnInit(): void {
    this.loadWholesaler();
  }

}
