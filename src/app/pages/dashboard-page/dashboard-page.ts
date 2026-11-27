import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MessageService } from 'primeng/api';
import { Card } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import type { ChartData, ChartOptions } from 'chart.js';
import { StatisticsService } from '../../services/statistics.service';
import { ProductActivity, StatisticsMetric, StatisticsResult, StockAlert, StoreHealth } from '../../types/statistics';
import { MoneyPipe } from '../../pipes/money.pipe';
import { CURRENCY_OPTIONS, currencyDecimals, DEFAULT_CURRENCY } from '../../utils/currencies';
import { getApiErrorMessage } from '../../utils/api-error';

type Period = '7d' | '30d' | '90d' | '12m';

type KpiTile = {
  metric: StatisticsMetric;
  label: string;
  money: boolean;
  suffix?: string;
};

// Chart colors: slot 1 of the validated categorical palette, recessive axes and grid
const SERIES_COLOR = '#2a78d6';
const SERIES_FILL = 'rgba(42, 120, 214, 0.12)';
const TEXT_SECONDARY = '#52514e';
const GRID_COLOR = 'rgba(11, 11, 11, 0.08)';

import { AuthService } from '../../services/auth.service';
@Component({
  selector: 'app-dashboard-page',
  imports: [
    DatePipe, DecimalPipe, FormsModule, RouterLink, MoneyPipe,
    Card, ChartModule, SelectModule, TableModule, TagModule, ButtonModule, SkeletonModule,
  ],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.sass',
})
export class DashboardPage implements OnInit {
  readonly authService = inject(AuthService);
  private readonly statisticsService = inject(StatisticsService);
  private readonly messageService = inject(MessageService);
  private readonly router = inject(Router);

  readonly periodOptions: { label: string; value: Period }[] = [
    { label: 'Last 7 days', value: '7d' },
    { label: 'Last 30 days', value: '30d' },
    { label: 'Last 90 days', value: '90d' },
    { label: 'Last 12 months', value: '12m' },
  ];
  readonly currencyOptions = CURRENCY_OPTIONS;

  period: Period = '30d';
  currency = DEFAULT_CURRENCY;

  readonly kpis: KpiTile[] = [
    { metric: 'revenue', label: 'Revenue', money: true },
    { metric: 'orders', label: 'Orders', money: false },
    { metric: 'avgOrderValue', label: 'Average order value', money: true },
    { metric: 'profit', label: 'Profit', money: true },
  ];

  readonly isLoading = signal(false);
  readonly summary = signal<StatisticsResult | null>(null);
  readonly timeline = signal<StatisticsResult | null>(null);
  readonly topProducts = signal<StatisticsResult | null>(null);
  readonly byStore = signal<StatisticsResult | null>(null);
  readonly stockAlerts = signal<StockAlert[]>([]);
  readonly storeHealth = signal<StoreHealth[]>([]);
  readonly slowMovers = signal<ProductActivity[]>([]);

  /** The backend gives statistics to SYSADMINs and store members only. */
  readonly noStatisticsAccess = computed(() => {
    const user = this.authService.currentUser();
    return !!user && user.globalRole !== 'SYSADMIN' && !user.storeMembership;
  });

  /** Currency of the loaded data (the select may already show a new one while loading). */
  readonly dataCurrency = computed(() => this.summary()?.meta.currency ?? this.currency);

  // ---------- chart data

  readonly revenueChart = computed<ChartData<'line'>>(() => {
    const rows = this.timeline()?.rows ?? [];
    const key = this.timeKey();
    return {
      labels: rows.map(row => this.formatBucket(String(row[key]))),
      datasets: [{
        label: 'Revenue',
        data: rows.map(row => Number(row['revenue'] ?? 0)),
        borderColor: SERIES_COLOR,
        backgroundColor: SERIES_FILL,
        borderWidth: 2,
        fill: true,
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHitRadius: 12,
      }],
    };
  });

  readonly ordersChart = computed<ChartData<'bar'>>(() => {
    const rows = this.timeline()?.rows ?? [];
    const key = this.timeKey();
    return {
      labels: rows.map(row => this.formatBucket(String(row[key]))),
      datasets: [{
        label: 'Orders',
        data: rows.map(row => Number(row['orders'] ?? 0)),
        backgroundColor: SERIES_COLOR,
        borderRadius: 4,
        maxBarThickness: 24,
      }],
    };
  });

  readonly topProductsChart = computed<ChartData<'bar'>>(() => this.rankingChart(this.topProducts(), 'product'));
  readonly byStoreChart = computed<ChartData<'bar'>>(() => this.rankingChart(this.byStore(), 'store'));

  readonly moneyLineOptions = computed<ChartOptions<'line'>>(() => this.timeOptions(true) as ChartOptions<'line'>);
  readonly countBarOptions = computed<ChartOptions<'bar'>>(() => this.timeOptions(false) as ChartOptions<'bar'>);
  readonly topProductsOptions = computed<ChartOptions<'bar'>>(() => this.rankingOptions(this.topProducts(), 'product'));
  readonly byStoreOptions = computed<ChartOptions<'bar'>>(() => this.rankingOptions(this.byStore(), 'store'));

  // A bar opens the detail page of its product or store
  private rankingOptions(result: StatisticsResult | null, dimension: 'product' | 'store'): ChartOptions<'bar'> {
    const currency = this.dataCurrency();
    const detailId = (index: number | undefined) => {
      const id = index === undefined ? null : result?.rows?.[index]?.[dimension];
      // an unknown product has no detail page (key: sku:<SKU>)
      return typeof id === 'string' && !id.startsWith('sku:') ? id : null;
    };

    return {
      indexAxis: 'y',
      maintainAspectRatio: false,
      onClick: (_event, elements) => {
        const id = detailId(elements[0]?.index);
        if (id) this.router.navigate([`/${dimension}`, id]);
      },
      onHover: (event, elements) => {
        const target = event.native?.target as HTMLElement | undefined;
        if (target) target.style.cursor = detailId(elements[0]?.index) ? 'pointer' : 'default';
      },
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ` ${this.formatMoney(Number(ctx.parsed.x), currency)}` } },
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: { color: GRID_COLOR },
          border: { display: false },
          ticks: { color: TEXT_SECONDARY, callback: value => this.formatCompact(Number(value)) },
        },
        y: { grid: { display: false }, ticks: { color: TEXT_SECONDARY, autoSkip: false } },
      },
    };
  }

  ngOnInit(): void {
    // After a page reload the profile may still be loading
    this.authService.ensureCurrentUser().subscribe(() => {
      if (!this.noStatisticsAccess()) this.load();
    });
  }

  load() {
    const range = this.range();
    const base = { from: range.from, to: range.to, currency: this.currency };
    const timeDimension = this.period === '12m' ? 'month' : this.period === '90d' ? 'week' : 'day';

    this.isLoading.set(true);

    forkJoin({
      summary: this.statisticsService.query({
        ...base,
        metrics: ['revenue', 'orders', 'avgOrderValue', 'profit', 'margin', 'needsAttention'],
        compare: 'previous',
      }),
      timeline: this.statisticsService.query({ ...base, metrics: ['revenue', 'orders'], groupBy: [timeDimension] }),
      topProducts: this.statisticsService.query({
        ...base, metrics: ['revenue', 'itemsSold'], groupBy: ['product'], sort: '-revenue', limit: 10,
      }),
      byStore: this.statisticsService.query({ ...base, metrics: ['revenue', 'orders'], groupBy: ['store'], sort: '-revenue' }),
      stockAlerts: this.statisticsService.stockAlerts({ days: 30, horizonDays: 14 }),
      storeHealth: this.statisticsService.integrationHealth(),
      slowMovers: this.statisticsService.slowMovers({ days: 30 }),
    }).subscribe({
      next: result => {
        this.summary.set(result.summary);
        this.timeline.set(result.timeline);
        this.topProducts.set(result.topProducts);
        this.byStore.set(result.byStore);
        this.stockAlerts.set(result.stockAlerts.slice(0, 10));
        this.storeHealth.set(result.storeHealth);
        this.slowMovers.set(result.slowMovers.slice(0, 10));
        this.isLoading.set(false);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: getApiErrorMessage(error, 'Failed to load the statistics!'),
        });
      },
    });
  }

  // ---------- KPI helpers

  kpiValue(metric: StatisticsMetric): number | null {
    return this.summary()?.totals[metric] ?? null;
  }

  kpiChange(metric: StatisticsMetric): number | null {
    return this.summary()?.previous?.change[metric] ?? null;
  }

  // ---------- formatting

  formatMoney(value: number, currency: string): string {
    const decimals = currencyDecimals(currency);
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency, minimumFractionDigits: decimals, maximumFractionDigits: decimals,
    }).format(value);
  }

  private formatCompact(value: number): string {
    return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
  }

  private timeKey(): string {
    return this.timeline()?.meta.groupBy[0] ?? 'day';
  }

  /** Bucket keys are YYYY-MM-DD (day, week) or YYYY-MM (month). */
  private formatBucket(key: string): string {
    if (/^\d{4}-\d{2}$/.test(key)) {
      const [year, month] = key.split('-').map(Number);
      return new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }
    const [year, month, day] = key.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  private rankingChart(result: StatisticsResult | null, dimension: 'product' | 'store'): ChartData<'bar'> {
    const rows = result?.rows ?? [];
    return {
      labels: rows.map(row => String(row[`${dimension}Label`] ?? row[dimension] ?? '-')),
      datasets: [{
        label: 'Revenue',
        data: rows.map(row => Number(row['revenue'] ?? 0)),
        backgroundColor: SERIES_COLOR,
        borderRadius: 4,
        maxBarThickness: 20,
      }],
    };
  }

  private timeOptions(money: boolean): ChartOptions {
    const currency = this.dataCurrency();
    return {
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ` ${money ? this.formatMoney(Number(ctx.parsed.y), currency) : ctx.parsed.y}`,
          },
        },
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: TEXT_SECONDARY, maxTicksLimit: 8, maxRotation: 0 } },
        y: {
          beginAtZero: true,
          grid: { color: GRID_COLOR },
          border: { display: false },
          ticks: {
            color: TEXT_SECONDARY,
            precision: money ? undefined : 0,
            callback: value => this.formatCompact(Number(value)),
          },
        },
      },
    };
  }

  /** Calendar days of the selected period, ending today. */
  private range(): { from: string; to: string } {
    const today = new Date();
    const from = new Date(today);

    if (this.period === '12m') {
      from.setMonth(from.getMonth() - 11, 1);
    } else {
      const days = { '7d': 7, '30d': 30, '90d': 90 }[this.period];
      from.setDate(from.getDate() - days + 1);
    }

    return { from: toCalendarDate(from), to: toCalendarDate(today) };
  }
}

function toCalendarDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
