import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { Card } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { WholesalersService } from '../../services/wholesalers.service';
import { Wholesaler } from '../../types/wholesaler';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-wholesalers-page',
  imports: [Card, TableModule, ButtonModule, TagModule, RouterLink, ProgressSpinnerModule, ToastModule],
  providers: [MessageService],
  templateUrl: './wholesalers-page.html',
  styleUrl: './wholesalers-page.sass',
})
export class WholesalersPage implements OnInit {

  private readonly wholesalersService = inject(WholesalersService);
  private readonly messageService = inject(MessageService);

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
      error: () => {
        this.isLoading.set(false);
      }
    })
  }

  ngOnInit(): void {
    this.loadWholesaler();
  }

  syncWholesalerCatalog(id: string) {
    this.wholesalersService.syncCatalog(id).subscribe({
      next: (result) => {
        this.messageService.add({
          severity: result.failed.length ? 'warn' : 'success',
          summary: 'Wholesaler catalog updated',
          detail: `${result.total} products: ${result.created} created, ${result.updated} updated, `
            + `${result.zeroed} zeroed, ${result.failed.length} failed`,
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to update wholesaler catalog!',
        });
      }
    })
  }
}
