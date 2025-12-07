import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  computed,
  effect,
  Signal,
} from '@angular/core';

import { takeUntil } from 'rxjs';
import { Subject } from 'rxjs';
import { Organization } from '../../core/entities/classes/organization';
import { AuthStore } from '../../core/states/auth.store';
import { OrgService } from '../../core/services/org.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  readonly organizations = signal<Organization[]>([]);
  readonly filterTerm = signal('');
  readonly expandedId = signal<string | null>(null);
  readonly loading = signal(false);

  readonly currentPage = signal(1);
  readonly pageSize = 10;

  readonly filteredOrgs = computed(() => {
    const term = this.filterTerm().toLowerCase();
    return this.organizations().filter(
      (org) =>
        org.name.toLowerCase().includes(term) ||
        org.countryCode.toLowerCase().includes(term) ||
        org.currencyCode.toLowerCase().includes(term)
    );
  });

  readonly totalPages = computed(() =>
    Math.ceil(this.filteredOrgs().length / this.pageSize)
  );

  readonly pagedOrgs = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredOrgs().slice(start, start + this.pageSize);
  });

  constructor(
    private authStore: AuthStore,
    private orgService: OrgService
  ) {}

  ngOnInit(): void {
    if (this.authStore.isAuthenticated()) {
      this.fetchOrganizations();
    }
  }

  fetchOrganizations(): void {
    this.loading.set(true);
    const params = {
      filter: '',
      sort: '',
      pageNumber: 1,
      pageSize: 1000,
      includeNavigations: true,
    };

    this.orgService
      .list(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: { organizations: Organization[]; totalCount: number }) => {
          this.organizations.set(res.organizations);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Failed to fetch organizations:', err);
          this.loading.set(false);
        },
      });
  }

  toggleDetails(id: string): void {
    this.expandedId.update((cur) => (cur === id ? null : id));
  }

  changePage(page: number): void {
    this.currentPage.set(page);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
