import { Component, OnInit, OnDestroy, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { OrgService } from '../../core/services/org.service';
import { AuthStore } from '../../core/states/auth.store';
import { FormsModule, NgForm } from '@angular/forms';

// Lightweight Branch & Organization interfaces kept here for portability; replace with your canonical imports if you have them
export interface Branch {
  id: string;
  name: string;
  code: string;
}
export interface Organization {
  id: string;
  name: string;
  countryCode: string;
  currencyCode: string;
  branches: Branch[];
}

@Component({
  selector: 'app-org-component',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="organization-table-container">
  <h2>Organizations</h2>
  <input type="text" class="filter-input" placeholder="Search organizations..." (keyup)="applyFilter($event)" />
  <div class="progress-bar" *ngIf="loading()"></div>

  <div class="table-wrapper">
    <table>
      <!-- static header -->
      <thead>
        <tr>
          <th (click)="sortBy('name')">
            <span [class.active]="sortColumn() === 'name'">
              Name
              <ng-container *ngIf="sortColumn() === 'name'">
                {{ sortDirection() === 'asc' ? '⬆' : '⬇' }}
              </ng-container>
            </span>
          </th>
          <th (click)="sortBy('countryCode')">
            <span [class.active]="sortColumn() === 'countryCode'">
              Country
              <ng-container *ngIf="sortColumn() === 'countryCode'">
                {{ sortDirection() === 'asc' ? '⬆' : '⬇' }}
              </ng-container>
            </span>
          </th>
          <th (click)="sortBy('currencyCode')">
            <span [class.active]="sortColumn() === 'currencyCode'">
              Currency
              <ng-container *ngIf="sortColumn() === 'currencyCode'">
                {{ sortDirection() === 'asc' ? '⬆' : '⬇' }}
              </ng-container>
            </span>
          </th>
          <th><span>#Branches</span></th>
          <th><span>Actions</span></th>
        </tr>
      </thead>

      <!-- reactive body -->
      <tbody>
        <tr *ngFor="let org of organizations(); trackBy: trackById">
          <td>{{ org.name }}</td>
          <td>{{ org.countryCode }}</td>
          <td>{{ org.currencyCode }}</td>
          <td>{{ org.branches.length || 0 }}</td>
          <td>
            <button class="btn btn-edit" (click)="openEditModal(org)">Edit</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- pagination -->
  <div class="pagination-alt">
    <button class="arrow-btn" [disabled]="pageIndex() === 0" (click)="goToPage(pageIndex() - 1)">◀</button>
    <span class="page-info" (mouseenter)="editingPage = true" (mouseleave)="editingPage = false">
      <ng-container *ngIf="!editingPage">
        Page {{ pageIndex() + 1 }} / {{ totalPages() }}
      </ng-container>
      <ng-container *ngIf="editingPage">
        <input type="number"
               class="page-jump-input"
               [min]="1"
               [max]="totalPages()"
               [value]="pageIndex() + 1"
               (blur)="confirmPageJump($event)"
               (keyup.enter)="confirmPageJump($event)" />
        <span>/ {{ totalPages() }}</span>
      </ng-container>
    </span>
    <button class="arrow-btn"
            [disabled]="pageIndex() >= totalPages() - 1"
            (click)="goToPage(pageIndex() + 1)">▶</button>
    <select class="page-size"
            [value]="pageSize()"
            (change)="changePageSize($any($event.target).value)"
            aria-label="Page size">
      <option *ngFor="let size of pageSizeOptions" [value]="size">{{ size }}</option>
    </select>
  </div>



  <div class="modal fade show d-block" tabindex="-1" *ngIf="editModalOpen" (click)="closeEditModal()">
    <div class="modal-dialog modal-xl modal-dialog-centered" (click)="$event.stopPropagation()">
      <div class="modal-content glass-card">
        <div class="modal-header">
          <h5 class="modal-title">Edit Organization</h5>
          <button type="button" class="btn-close" (click)="closeEditModal()"></button>
        </div>

        <form #editForm="ngForm" (ngSubmit)="saveEdit(editForm)">
          <div class="modal-body">
            <div class="row g-3">
              <div class="col-md-4">
                <label class="form-label">Name</label>
                <input type="text" class="form-control" name="name" [(ngModel)]="editOrg.name" required minlength="2" maxlength="60" />
              </div>
              <div class="col-md-4">
                <label class="form-label">Country Code</label>
                <input type="text" class="form-control" name="countryCode" [(ngModel)]="editOrg.countryCode" required pattern="[A-Z]{2,3}" maxlength="3" />
              </div>
              <div class="col-md-4">
                <label class="form-label">Currency Code</label>
                <input type="text" class="form-control" name="currencyCode" [(ngModel)]="editOrg.currencyCode" required pattern="[A-Z]{3}" maxlength="3" />
              </div>
            </div>

            <hr class="my-4" />

            <section>
              <div class="d-flex justify-content-between align-items-center mb-3">
                
                <div *ngIf="filteredBranches().length > 0" class="d-flex gap-2">
                  <input type="text" class="form-control form-control-sm" placeholder="Search branches..." [(ngModel)]="branchFilter" name="branchFilter" />
                </div>
                <div>
                  <button type="button" class="btn btn-sm btn-outline-primary" (click)="addBranch()">+ Add Branch</button>
                </div>
              </div>

              <div *ngIf="filteredBranches().length === 0" class="text-muted fst-italic">No branches found.</div>

              <div *ngIf="filteredBranches().length > 0" class="table-responsive">
                <table class="table table-hover align-middle glass-subcard">
                 <thead class="table-light">
  <tr>
    <th>#</th>
    <th (click)="sortBranches('name')"> 
      <span [class.active]="branchSortColumn() === 'name'">Name
      <ng-container *ngIf="branchSortColumn() === 'name'">
        {{ branchSortDirection() === 'asc' ? '⬆' : '⬇' }}
      </ng-container></span>
    </th>
    <th (click)="sortBranches('code')"><span [class.active]="branchSortColumn() === 'code'">Code
      <ng-container *ngIf="branchSortColumn() === 'code'">
        {{ branchSortDirection() === 'asc' ? '⬆' : '⬇' }}
      </ng-container></span>
    </th>
    <th class="text-end">Actions</th>
  </tr>
</thead>

                  <tbody>
                    <tr *ngFor="let branch of pagedBranches(); let i = index; trackBy: trackByBranchId">
                      <td>{{ (branchCurrentPage - 1) * branchPageSize + i + 1 }}</td>
                      <td>
                        <input type="text" class="form-control form-control-sm" [(ngModel)]="branch.name" name="branchName-{{i}}" required minlength="1" maxlength="60" #bn="ngModel" />
                        <div *ngIf="bn?.invalid && editForm.submitted" class="text-danger small">Branch name is required.</div>
                      </td>
                      <td>
                        <input type="text" class="form-control form-control-sm" [(ngModel)]="branch.code" name="branchCode-{{i}}" required pattern="[A-Z0-9]{1,10}" maxlength="10" #bc="ngModel" />
                        <div *ngIf="bc?.invalid && editForm.submitted" class="text-danger small">Branch code required (letters/numbers, up to 10).</div>
                      </td>
                      <td class="text-end">
                        <button type="button" class="btn btn-sm btn-outline-danger" (click)="removeBranch(i)">Delete</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <nav *ngIf="totalBranchPages() > 1" class="d-flex justify-content-between align-items-center">
                <small class="text-muted">Page {{ branchCurrentPage }} of {{ totalBranchPages() }}</small>
                <ul class="pagination pagination-sm mb-0">
                  <li class="page-item" [class.disabled]="branchCurrentPage === 1">
                    <button class="page-link" type="button" (click)="prevBranchPage()">Previous</button>
                  </li>
                  <li class="page-item" [class.disabled]="branchCurrentPage === totalBranchPages()">
                    <button class="page-link" type="button" (click)="nextBranchPage()">Next</button>
                  </li>
                </ul>
              </nav>
            </section>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-outline-secondary" (click)="closeEditModal()" [disabled]="loadingEdit">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="loadingEdit">{{ loadingEdit ? 'Saving...' : 'Save' }}</button>
          </div>

          <div class="text-danger text-center pb-3" *ngIf="editError">{{ editError }}</div>
        </form>
      </div>
    </div>
  </div>
</div>
  `,
  styles: [`
/* =====================
   General Layout
===================== */
/* =====================
   Organization Section
===================== */
.organization-table-container {
  background: #fff;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 0.5rem 1rem rgba(0,0,0,.1);
}

/* Header */
.organization-table-container h2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #212529;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Search box */
.filter-input {
  width: 100%;
  max-width: 300px;
  padding: 0.5rem 0.75rem;
  margin-bottom: 1rem;
  border: 1px solid #dee2e6;
  border-radius: 0.5rem;
  font-size: 0.9rem;
  transition: border-color .2s, box-shadow .2s;
}
.filter-input:focus {
  border-color: #00bcd4;
  box-shadow: 0 0 0 0.2rem rgba(13,110,253,.25);
  outline: none;
}

/* Progress bar (loading indicator) */
.progress-bar {
  height: 4px;
  width: 100%;
  background: linear-gradient(90deg, #00bcd4, #6ea8fe);
  border-radius: 2px;
  animation: progress-indeterminate 1.5s infinite linear;
  margin-bottom: 1rem;
}
@keyframes progress-indeterminate {
  0% { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}

/* Table wrapper for responsive scroll */
.table-wrapper {
  overflow-x: auto;
  border-radius: 0.75rem;
  border: 1px solid #dee2e6;
}

/* Table */
.table-wrapper table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}
.table-wrapper thead th {
  background: #0d0d0d;
  font-weight: 600;
  font-size: 0.85rem;
  text-transform: uppercase;
  color: #fff;
  padding: 0.75rem;
  white-space: nowrap;
  cursor: pointer;
}
.table-wrapper thead th span.active {
  color: #00bcd4;
}
.table-wrapper tbody td {
  padding: 0.75rem;
  font-size: 0.9rem;
  color: #212529;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}
.table-wrapper tbody tr:hover {
  background-color: #f8f9fa;
}
.btn-edit {
  padding: 0.25rem 0.75rem;
  font-size: 0.8rem;
  border-radius: 0.375rem;
  border: 1px solid #00bcd4;
  background-color: #00bcd4;
  color: #fff;
  transition: background-color .2s;
}
.btn-edit:hover {
  background-color: #0b5ed7;
}

/* Pagination */
.pagination-alt {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1rem;
  flex-wrap: wrap;
}

.arrow-btn {
  border: 1px solid #dee2e6;
  background: #fff;
  color: #212529;
  border-radius: 0.375rem;
  padding: 0.25rem 0.75rem;
  cursor: pointer;
  transition: all .2s;
}
.arrow-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.arrow-btn:hover:not(:disabled) {
  background: #f8f9fa;
}

.page-info {
  font-size: 0.9rem;
  color: #495057;
}

.page-jump-input {
  width: 60px;
  padding: 0.25rem;
  font-size: 0.85rem;
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
  text-align: center;
}

.page-size {
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.85rem;
}


/* =====================
   Tables
===================== */
.table-wrapper {
  overflow-x: auto;
  width: fit-content;
  height: 500px;
}
.table {
  width: 100%;
  margin-bottom: 0;
  border-collapse: collapse;
  border-radius: 0.75rem;
  overflow: hidden;
}
.table thead th {
  cursor: pointer;
  white-space: nowrap;
  padding: 0.75rem;
  background: #0d0d0d;
  color: #fff;
  border-bottom: 2px solid #dee2e6;
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.85rem;
}
.table thead th span.active {
  color: #00bcd4;
}
.table tbody tr:hover {
  background: #f8f9fa;
}
.table td {
  padding: 0.75rem;
  vertical-align: middle;
}

/* =====================
   Buttons
===================== */
.btn-edit {
  font-size: 0.85rem;
  padding: 0.35rem 0.75rem;
  border-radius: 0.5rem;
}
.btn-outline-danger {
  font-size: 0.8rem;
  padding: 0.25rem 0.6rem;
  border-radius: 0.5rem;
}

/* =====================
   Pagination
===================== */
.pagination-alt {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-top: 1rem;
  gap: 0.75rem;
  flex-wrap: wrap;
}
.arrow-btn {
  background: #fff;
  border: 1px solid #dee2e6;
  padding: 0.3rem 0.6rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
}
.arrow-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.page-info {
  font-size: 0.9rem;
  cursor: pointer;
}
.page-jump-input {
  width: 60px;
  padding: 0.2rem 0.4rem;
  text-align: center;
}
.page-size {
  padding: 0.35rem 0.5rem;
  border-radius: 0.5rem;
  border: 1px solid #dee2e6;
}

/* =====================
   Modal Styling
===================== */
.modal-content.glass-card {
  border-radius: 1rem;
  border: none;
  background: #fff;
  box-shadow: 0 6px 24px rgba(0,0,0,0.15);
}
.modal-header {
  border-bottom: 1px solid #f1f3f5;
}
.modal-footer {
  border-top: 1px solid #f1f3f5;
}

/* =====================
   Form Controls
===================== */
.form-control {
  border-radius: 0.5rem;
}
.form-control:focus {
  border-color: #00bcd4;
  box-shadow: 0 0 0 0.15rem rgba(13,110,253,.25);
}
.form-label {
  font-weight: 500;
  margin-bottom: 0.25rem;
}
.text-danger.small {
  font-size: 0.75rem;
}

/* =====================
   Branch Table
===================== */
.glass-subcard {
  border-radius: 0.75rem;
  overflow: hidden;
  border: 1px solid #dee2e6;
}
.glass-subcard thead {
  background: #f8f9fa;
}
.glass-subcard td {
  vertical-align: middle;
}

/* =====================
   Progress Bar (loading indicator)
===================== */
.progress-bar {
  height: 4px;
  width: 100%;
  background: linear-gradient(90deg, #00bcd4, #6f42c1, #00bcd4);
  background-size: 200% 100%;
  animation: progress-bar-stripes 1.5s linear infinite;
  border-radius: 2px;
  margin-bottom: 0.75rem;
}
@keyframes progress-bar-stripes {
  from { background-position: 200% 0; }
  to { background-position: -200% 0; }
}

/* =====================
   Responsive
===================== */
@media (max-width: 768px) {
  .organization-table-container {
    padding: 1rem;
  }
  .pagination-alt {
    justify-content: center;
  }
}
  `]

})
export class Org implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  readonly organizations = signal<Organization[]>([]);
  readonly loading = signal<boolean>(false);
  readonly filterValue = signal<string>('');
  readonly totalCount = signal<number>(0);
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.totalCount() / this.pageSize())));
  readonly pageSizeOptions = [7, 10, 20];
  readonly pageSize = signal<number>(7);
  readonly pageIndex = signal<number>(0);
  readonly sortColumn = signal<string>('name');
  readonly sortDirection = signal<'asc' | 'desc'>('asc');

  readonly branchSortColumn = signal<'name' | 'code'>('name');
  readonly branchSortDirection = signal<'asc' | 'desc'>('asc');

  editingPage: boolean = false;
  editModalOpen = false;
  editOrg!: Organization;
  loadingEdit = false;
  editError = '';
  branchFilter = '';
  branchCurrentPage = 1;
  branchPageSize = 5;

  filteredBranches() {
    let branches = this.editOrg?.branches || [];
    if (this.branchFilter) {
      const term = this.branchFilter.toLowerCase();
      branches = branches.filter(b =>
        b.name?.toLowerCase().includes(term) ||
        b.code?.toLowerCase().includes(term)
      );
    }

    const column = this.branchSortColumn();
    const direction = this.branchSortDirection();

    return [...branches].sort((a, b) => {
      const valA = (a[column] || '').toString().toLowerCase();
      const valB = (b[column] || '').toString().toLowerCase();
      return direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });
  }

  sortBranches(column: 'name' | 'code') {
    debugger
    if (this.branchSortColumn() === column) {
      this.branchSortDirection.set(this.branchSortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.branchSortColumn.set(column);
      this.branchSortDirection.set('asc');
    }
  }



  pagedBranches() {
    const start = (this.branchCurrentPage - 1) * this.branchPageSize;
    return this.filteredBranches().slice(start, start + this.branchPageSize);
  }

  totalBranchPages() {
    return Math.ceil(this.filteredBranches().length / this.branchPageSize) || 1;
  }

  nextBranchPage() {
    if (this.branchCurrentPage < this.totalBranchPages()) this.branchCurrentPage++;
  }

  prevBranchPage() {
    if (this.branchCurrentPage > 1) this.branchCurrentPage--;
  }

  constructor(private authStore: AuthStore, private orgService: OrgService) { }

  ngOnInit(): void {
    if (this.authStore.isAuthenticated()) this.fetchOrganizations();
  }

  fetchOrganizations(): void {
    this.loading.set(true);
    const params = {
      filter: this.filterValue(),
      sort: `${this.sortColumn()} ${this.sortDirection()}`,
      pageNumber: this.pageIndex() + 1,
      pageSize: this.pageSize(),
      includeNavigations: true,
    } as any;

    this.orgService
      .list(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.organizations.set(res.organizations || []);
          this.totalCount.set(res.totalCount || (res.organizations || []).length);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        },
      });
  }

  openEditModal(org: Organization) {
    // this.editOrg = JSON.parse(JSON.stringify(org || { branches: [] }));

    this.editOrg = structuredClone(org);


    if (!this.editOrg.branches) this.editOrg.branches = [];
    this.editError = '';
    this.editModalOpen = true;
  }

  closeEditModal() {
    if (this.loadingEdit) return;
    this.editModalOpen = false;
    this.editError = '';
  }

  addBranch() {
    
    const newBranch: Branch = { id: ``, name: '', code: '' };
    this.editOrg.branches.push(newBranch);
    this.branchSortDirection.set('desc');
    this.sortBranches('name');
  }



  removeBranch(index: number) {
    const branch = this.editOrg.branches[index];
    console.log('Removing branch:', branch);
    if (!branch) return;
    // const persisted = !branch.id?.toString();
    // if (persisted) {
    //   if (!confirm(`Delete branch "${branch.name || branch.code}"? This will be removed when you save the organization.`)) return;
    // }
    this.editOrg.branches.splice(index, 1);
  }

  saveEdit(form: NgForm) {
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }
    const invalidBranch = this.editOrg.branches?.some(b => !b.name || !b.code || b.code.length > 10);
    if (invalidBranch) {
      this.editError = 'Please fix branch name/code errors before saving.';
      this.branchSortDirection.set('desc');
      this.sortBranches('name');
      return;
    }

    this.loadingEdit = true;
    this.editError = '';

    this.orgService
      .update(this.editOrg)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedOrg: Organization) => {
          const list = [...this.organizations()];
          const ix = list.findIndex(o => o.id === updatedOrg.id);
          if (ix >= 0) list[ix] = updatedOrg;
          else list.unshift(updatedOrg);
          this.organizations.set(list);
          this.editModalOpen = false;
          this.loadingEdit = false;
        },
        error: (err) => {
          console.error('Error saving organization:', err);
          this.editError = 'Failed to save organization. Please try again.';
          this.loadingEdit = false;
        },
      });
  }

  applyFilter(event: any) {
    this.filterValue.set(event.target.value);
    this.pageIndex.set(0);
    this.fetchOrganizations();
  }

  sortBy(column: string) {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
    this.fetchOrganizations();
  }

  goToPage(index: number) {
    if (index < 0 || index >= this.totalPages()) return;
    this.pageIndex.set(index);
    this.fetchOrganizations();
  }

  confirmPageJump(event: any) {
    const value = parseInt(event.target.value, 10);
    if (!isNaN(value) && value >= 1 && value <= this.totalPages()) {
      this.pageIndex.set(value - 1);
      this.fetchOrganizations();
    }
    this.editingPage = false;
  }

  changePageSize(size: number) {
    this.pageSize.set(Number(size));
    this.pageIndex.set(0);
    this.fetchOrganizations();
  }

  trackById(index: number, item: Organization) {
    return item.id;
  }

  trackByBranchId(index: number, item: Branch) {
    return item.id || index;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
