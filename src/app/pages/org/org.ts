import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';

import { Observable, Subject, takeUntil } from 'rxjs';
import { OrgService } from '../../core/services/org.service';
import { AuthStore } from '../../core/states/auth.store';
import { FormsModule, NgForm } from '@angular/forms';
import { v7 as uuidv7 } from 'uuid';
import { SkeletonLoader } from '../../shared/skeleton-loader/skeleton-loader';


// Interfaces
export interface Branch {
  id: string;
  name: string;
  code: string;
  isNew?: boolean;
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
  imports: [FormsModule, SkeletonLoader],
  template: `
<div class="organization-table-container">
  <!-- Org Table -->


  <!-- Search + Add Button Row -->
  <div class="d-flex justify-content-between align-items-center mb-3">
    <!-- Left: Search Input -->
    <input type="text"
      class="form-control w-50"
      placeholder="Search organizations..."
      (keyup)="applyFilter($event)" />

    <!-- Right: Add Button -->
    <button class="btn btn-primary" (click)="openAddModal()">
      + Add Organization
    </button>
  </div>

  <div class="table-wrapper">
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th (click)="sortBy('name')">
            <span [class.active]="sortColumn() === 'name'">
              Name
              @if (sortColumn() === 'name') {
                {{ sortDirection() === 'asc' ? '⬆' : '⬇' }}
              }
            </span>
          </th>
          <th (click)="sortBy('countryCode')">
            <span [class.active]="sortColumn() === 'countryCode'">
              Country
              @if (sortColumn() === 'countryCode') {
                {{ sortDirection() === 'asc' ? '⬆' : '⬇' }}
              }
            </span>
          </th>
          <th (click)="sortBy('currencyCode')">
            <span [class.active]="sortColumn() === 'currencyCode'">
              Currency
              @if (sortColumn() === 'currencyCode') {
                {{ sortDirection() === 'asc' ? '⬆' : '⬇' }}
              }
            </span>
          </th>
          <th><span>#Branches</span></th>
          <th><span>Actions</span></th>
        </tr>
      </thead>
      <tbody>
         <!-- ✅ Show Skeleton when loading() === true -->
  @if (loading()) {
  <tr>
    <td colspan="6">

<!-- place in any template after importing the component -->
<app-skeleton-loader
  [rows]="pageSize()"
  height="40px"
  radius="10px"
>
</app-skeleton-loader>

    </td>
  </tr>
}

        @else {
        @for (org of organizations(); track trackById(i, org); let i = $index) {
          <tr>
            <td>{{ (pageIndex() * pageSize()) + (i + 1) }}</td>
            <td>{{ org.name }}</td>
            <td>{{ org.countryCode }}</td>
            <td>{{ org.currencyCode }}</td>
            <td>{{ org.branches.length || 0 }}</td>
            <td>
              <i (click)="openEditModal(org)" title="Edit" class="fa fa-pencil-alt edit-icon"></i>
              <i (click)="removeOrg(org)" title="Delete" class="fa fa-trash-alt delete-icon ms-1"></i>
            </td>
          </tr>
        }
}
      </tbody>
    </table>
  </div>


  <!-- Pagination -->
  <div class="pagination-alt">
    <button class="arrow-btn" [disabled]="pageIndex() === 0" (click)="goToPage(pageIndex() - 1)">◀</button>
    <span class="page-info" (mouseenter)="editingPage = true" (mouseleave)="editingPage = false">
      @if (!editingPage) {
        Page {{ pageIndex() + 1 }} / {{ totalPages() }}
      }
      @if (editingPage) {
        <input type="number"
          class="page-jump-input"
          [min]="1"
          [max]="totalPages()"
          [value]="pageIndex() + 1"
          (keyup.enter)="confirmPageJump($event)"
          (blur)="editingPage = false" />
        <span>/ {{ totalPages() }}</span>
      }
    </span>
    <button class="arrow-btn" [disabled]="pageIndex() >= totalPages() - 1" (click)="goToPage(pageIndex() + 1)">▶</button>
    <select class="page-size"
      [value]="pageSize()"
      (change)="changePageSize($any($event.target).value)">
      @for (size of pageSizeOptions; track size) {
        <option [value]="size">{{ size }}</option>
      }
    </select>
  </div>

  <!-- Modal -->
  @if (editModalOpen) {
    <div class="modal fade show d-block" tabindex="-1" (click)="closeEditModal()">
      <div class="modal-dialog modal-xl modal-dialog-centered" (click)="$event.stopPropagation()">
        <div class="modal-content glass-card">
          <div class="modal-header">
            <h5 class="modal-title">@if (!isEditOrg) {
              <span>Add</span>
              }@if (isEditOrg) {
              <span>Edit</span>
            } Organization</h5>
            <button type="button" class="btn-close" (click)="closeEditModal()"></button>
          </div>
          <form #editForm="ngForm" (ngSubmit)="saveEdit(editForm)">
            <div class="modal-body">
              <!-- Org fields -->
              <div class="row g-3">
                <div class="col-md-4">
                  <label class="form-label">Name</label>
                  <input type="text"
                    class="form-control"
                    name="name"
                    [(ngModel)]="editAddOrg.name"
                    required minlength="2" maxlength="60"
                    #orgName="ngModel" />
                  @if (orgName.invalid && (orgName.touched || editForm.submitted)) {
                    <div class="text-danger small">
                      Organization name is required (min 2 characters).
                    </div>
                  }
                </div>
                <div class="col-md-4">
                  <label class="form-label">Country Code</label>
                  <input type="text"
                    class="form-control"
                    name="countryCode"
                    [(ngModel)]="editAddOrg.countryCode"
                    required pattern="[A-Z]{2,3}" maxlength="3"
                    #countryCode="ngModel" />
                  @if (countryCode.invalid && (countryCode.touched || editForm.submitted)) {
                    <div class="text-danger small">
                      Country code is required (2–3 uppercase letters).
                    </div>
                  }
                </div>
                <div class="col-md-4">
                  <label class="form-label">Currency Code</label>
                  <input type="text"
                    class="form-control"
                    name="currencyCode"
                    [(ngModel)]="editAddOrg.currencyCode"
                    required pattern="[A-Z]{3}" maxlength="3"
                    #currencyCode="ngModel" />
                  @if (currencyCode.invalid && (currencyCode.touched || editForm.submitted)) {
                    <div class="text-danger small">
                      Currency code is required (3 uppercase letters).
                    </div>
                  }
                </div>
              </div>
              <hr class="my-4" />
              <!-- Branch section -->
              <section>
                <div class="d-flex justify-content-between align-items-center mb-3">
                  @if (filteredBranches().length > 0) {
                    <div class="d-flex gap-2">
                      <input type="text" class="form-control form-control-sm"
                        placeholder="Search branches..."
                        [(ngModel)]="branchFilter"
                        name="branchFilter" />
                    </div>
                  }
                  <div>
                    <button type="button" class="btn btn-sm btn-outline-primary" (click)="addBranch()">+ Add Branch</button>
                  </div>
                </div>
                @if (filteredBranches().length === 0 && newBranches.length === 0) {
                  <div class="text-muted fst-italic">
                    No branches found.
                  </div>
                }
                @if (filteredBranches().length > 0 || newBranches.length > 0) {
                  <div class="table-responsive">
                    <table class="table table-hover align-middle glass-subcard">
                      <thead class="table-light">
                        <tr>
                          <th>#</th>
                          <th (click)="sortBranches('name')">Name</th>
                          <th (click)="sortBranches('code')">Code</th>
                          <th class="text-end">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <!-- New branches -->
                        @for (branch of newBranches; track trackByBranchId(i, branch); let i = $index) {
                          <tr class="branch-new">
                            <td>NEW</td>
                            <td>
                              <input type="text"
                                class="form-control form-control-sm"
                                [(ngModel)]="branch.name"
                                name="branchName-{{branch.id}}"
                                required minlength="1" maxlength="60"
                                #bnNew="ngModel" />
                              @if (bnNew.invalid && (bnNew.touched || editForm.submitted)) {
                                <div class="text-danger small">
                                  Branch name is required.
                                </div>
                              }
                            </td>
                            <td>
                              <input type="text"
                                class="form-control form-control-sm"
                                [(ngModel)]="branch.code"
                                name="branchCode-{{branch.id}}"
                                required maxlength="10"
                                #bcNew="ngModel" />
                              @if (bcNew.invalid && (bcNew.touched || editForm.submitted)) {
                                <div class="text-danger small">
                                  Branch code required.
                                </div>
                              }
                            </td>
                            <td class="text-end">
                              <i (click)="removeBranch(branch.id, true)" title="Delete" class="fa fa-trash-alt delete-icon ms-1"></i>
                            </td>
                          </tr>
                        }
                        <!-- Existing branches -->
                        @for (branch of pagedBranches(); track trackByBranchId(i, branch); let i = $index) {
                          <tr
                            [class.branch-edited]="isEditingBranch(branch.id)">
                            <td>{{ (branchCurrentPage - 1) * branchPageSize + i + 1 }}</td>
                            <td>
                              @if (isEditingBranch(branch.id)) {
                                <input type="text"
                                  class="form-control form-control-sm"
                                  [(ngModel)]="branch.name"
                                  name="branchName-{{branch.id}}"
                                  required minlength="1" maxlength="60"
                                  #bn="ngModel" />
                                @if (bn.invalid && (bn.touched || editForm.submitted)) {
                                  <div class="text-danger small">
                                    Branch name is required.
                                  </div>
                                }
                              } @else {
                                {{ branch.name }}
                              }
                            </td>
                            <td>
                              @if (isEditingBranch(branch.id)) {
                                <input type="text"
                                  class="form-control form-control-sm"
                                  [(ngModel)]="branch.code"
                                  name="branchCode-{{branch.id}}"
                                  required pattern="[A-Z0-9]{1,10}" maxlength="10"
                                  #bc="ngModel" />
                                @if (bc.invalid && (bc.touched || editForm.submitted)) {
                                  <div class="text-danger small">
                                    Branch code is required (A–Z, 0–9, up to 10 chars).
                                  </div>
                                }
                              } @else {
                                {{ branch.code }}
                              }
                            </td>
                            <td class="text-end">
                              @if (isEditingBranch(branch.id)) {
                                <button type="button" class="btn btn-sm btn-outline-secondary" (click)="cancelEditBranch(branch.id)">Cancel</button>
                              } @else {
                                <i (click)="editBranch(branch.id)" title="Edit" class="fa fa-pencil-alt edit-icon"></i>
                              }
                              <i (click)="removeBranch(branch.id)" title="Delete" class="fa fa-trash-alt delete-icon ms-1"></i>
                            </td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                }
                <!-- Branch pagination -->
                @if (totalBranchPages() > 1) {
                  <nav class="d-flex justify-content-between align-items-center">
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
                }
              </section>
            </div>
            <div class="modal-footer">
              <button type="button"
                class="btn btn-outline-secondary"
                (click)="closeEditModal()"
                [disabled]="loadingEdit">
                Cancel
              </button>
              <button type="submit"
                class="btn btn-primary"
                [disabled]="loadingEdit || editForm.invalid || hasBranchValidationErrors()">
                {{ loadingEdit ? 'Saving...' : 'Save' }}
              </button>
            </div>
            @if (editError) {
              <div class="text-danger text-center pb-3">{{ editError }}</div>
            }
          </form>
        </div>
      </div>
    </div>
  }
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
  padding: 1.0rem;
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
   position: sticky;
  top: 0;
  z-index: 2; /* ensure header stays above body rows */
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
.delete-icon {
  font-size: 1rem;
  font-weight: bold;
  color: #dc3545; /* Bootstrap danger red */
  cursor: pointer;
  transition: color 0.2s ease, transform 0.2s ease, background-color 0.2s ease;
  padding: 0.25rem;
  border-radius: 0.375rem;
}

.delete-icon:hover {
  transform: scale(1.15);
  font-weight: bold;
}


.edit-icon {
  font-size: 1rem;
  font-weight: bold;
  color: #00bcd4; 
  cursor: pointer;
  transition: color 0.2s ease, transform 0.2s ease;
  padding: 0.25rem;
  border-radius: 0.375rem;
}

.edit-icon:hover {
  color: #00bcd4; /* highlight color */
  font-weight: bold;
  transform: scale(1.15);
  background-color: rgba(255, 255, 255, 0.1); /* subtle hover bg */
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
  height: 520px;
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
  readonly loading = signal<boolean>(false);
  readonly organizations = signal<Organization[]>([]);
  readonly filterValue = signal<string>('');
  readonly totalCount = signal<number>(0);
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.totalCount() / this.pageSize())));
  readonly pageSizeOptions = [10, 20, 50, 100];
  readonly pageSize = signal<number>(10);
  readonly pageIndex = signal<number>(0);
  readonly sortColumn = signal<string>('name');
  readonly sortDirection = signal<'asc' | 'desc'>('asc');

  readonly branchSortColumn = signal<'name' | 'code'>('name');
  readonly branchSortDirection = signal<'asc' | 'desc'>('asc');

  editingPage = false;
  editModalOpen = false;
  editAddOrg!: Organization;
  loadingEdit = false;
  editError = '';
  branchFilter = '';
  branchCurrentPage = 1;
  branchPageSize = 3;

  newBranches: Branch[] = [];
  private editingBranchIds = new Set<string>();
  // Store original positions (indexes) of branches when edit was started
  private editingBranchPositions = new Map<string, number>();
  isEditOrg: boolean = false;

  constructor(private authStore: AuthStore, private orgService: OrgService) { }

  ngOnInit(): void {
    if (this.authStore.isAuthenticated()) this.fetchOrganizations();
  }

  // === Branch logic ===
  filteredBranches(): Branch[] {
    const branches = this.editAddOrg?.branches || [];

    // Keep the base filtered array in the original (current) order of editAddOrg.branches
    let baseFiltered = branches;
    if (this.branchFilter) {
      const term = this.branchFilter.toLowerCase();
      baseFiltered = branches.filter(b => b.name?.toLowerCase().includes(term) || b.code?.toLowerCase().includes(term));
      this.branchCurrentPage = 1;
    }

    const column = this.branchSortColumn();
    const direction = this.branchSortDirection();

    const editingIds = new Set(Array.from(this.editingBranchIds));
    const editingBranches = baseFiltered.filter(b => editingIds.has(b.id));
    const nonEditingBranches = baseFiltered.filter(b => !editingIds.has(b.id));

    // Sort only non-editing ones
    nonEditingBranches.sort((a, b) => {
      const valA = (a[column] || '').toLowerCase();
      const valB = (b[column] || '').toLowerCase();
      return direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });

    // Build a map of positions -> editing branches (to handle multiple edits mapping to same index)
    const positionsMap = new Map<number, Branch[]>();
    // Ensure editingBranches preserves their appearance order in baseFiltered
    for (const b of editingBranches) {
      let pos = this.editingBranchPositions.get(b.id);
      if (pos === undefined || pos === null || isNaN(pos)) {
        pos = baseFiltered.indexOf(b);
      }
      // clamp
      pos = Math.max(0, Math.min(pos, Math.max(0, baseFiltered.length - 1)));
      if (!positionsMap.has(pos)) positionsMap.set(pos, []);
      positionsMap.get(pos)!.push(b);
    }

    // Reconstruct final array by iterating baseFiltered length and placing editing branches at stored positions
    const result: Branch[] = [];
    let nonIdx = 0;
    for (let i = 0; i < baseFiltered.length; i++) {
      if (positionsMap.has(i)) {
        const arr = positionsMap.get(i)!;
        for (const eb of arr) result.push(eb);
      } else {
        if (nonIdx < nonEditingBranches.length) {
          result.push(nonEditingBranches[nonIdx++]);
        }
      }
    }

    // If there are leftover non-editing branches (safety), append them
    while (nonIdx < nonEditingBranches.length) result.push(nonEditingBranches[nonIdx++]);

    return result;
  }

  pagedBranches(): Branch[] {
    const start = (this.branchCurrentPage - 1) * this.branchPageSize;
    const end = start + this.branchPageSize;

    // Now filteredBranches() returns branches with editing rows placed back at their recorded positions
    const all = this.filteredBranches();
    return all.slice(start, end);
  }

  totalBranchPages() { return Math.ceil(this.filteredBranches().length / this.branchPageSize) || 1; }
  nextBranchPage() { if (this.branchCurrentPage < this.totalBranchPages()) this.branchCurrentPage++; }
  prevBranchPage() { if (this.branchCurrentPage > 1) this.branchCurrentPage--; }
  sortBranches(column: 'name' | 'code') {
    if (this.branchSortColumn() === column) {
      this.branchSortDirection.set(this.branchSortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.branchSortColumn.set(column);
      this.branchSortDirection.set('asc');
    }
  }

  isEditingBranch(id: string) { return this.editingBranchIds.has(id); }
  editBranch(id: string) {
    // Capture the current index in the currently displayed list BEFORE turning on edit mode
    const displayed = this.filteredBranches();
    let pos = displayed.findIndex(b => b.id === id);
    if (pos === -1 && this.editAddOrg?.branches) {
      pos = this.editAddOrg.branches.findIndex(b => b.id === id);
    }
    if (pos < 0) pos = 0;
    this.editingBranchPositions.set(id, pos);
    this.editingBranchIds.add(id);
  }
  cancelEditBranch(id: string) { this.editingBranchIds.delete(id); this.editingBranchPositions.delete(id); }

  addBranch() {
    const id = uuidv7()
    const newBranch: Branch = { id, name: '', code: '', isNew: true };
    this.newBranches.unshift(newBranch);
  }
  removeBranch(id: string, isNew = false) {
    if (isNew) {
      this.newBranches = this.newBranches.filter(b => b.id !== id);
      return;
    }
    this.editAddOrg.branches = this.editAddOrg.branches.filter(b => b.id !== id);
    this.editingBranchIds.delete(id);
    this.editingBranchPositions.delete(id);
  }
  hasBranchValidationErrors(): boolean {
    const all = [...this.newBranches, ...(this.editAddOrg?.branches || [])];
    return all.some(b => !b.name || !b.code || b.code.length > 10);
  }

  // === Org logic ===
  fetchOrganizations(): void {
    this.loading.set(true);
    const params = {
      filter: this.filterValue(),
      sort: `${this.sortColumn()} ${this.sortDirection()}`,
      pageNumber: this.pageIndex() + 1,
      pageSize: this.pageSize(),
      includeNavigations: true,
    } as any;
    this.orgService.list(params).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.organizations.set(res.organizations || []);
        this.totalCount.set(res.totalCount || (res.organizations || []).length);
        this.loading.set(false);
      },
      error: () => { this.loading.set(false)}
      ,
    });
  }
  openEditModal(org: Organization) {
    this.isEditOrg = true;
    this.editAddOrg = structuredClone(org);
    if (!this.editAddOrg.branches) this.editAddOrg.branches = [];
    this.editError = '';
    this.branchFilter = '';
    this.branchCurrentPage = 1;
    this.editModalOpen = true;
    this.newBranches = [];
    this.editingBranchIds.clear();
    this.editingBranchPositions.clear();
  }
  closeEditModal() {
    if (!this.loadingEdit) { this.editModalOpen = false; this.editError = ''; }
  }
  saveEdit(form: NgForm) {
    if (form.invalid || this.hasBranchValidationErrors()) {
      form.control.markAllAsTouched();
      return;
    }
    this.editAddOrg.branches = [...this.newBranches, ...this.editAddOrg.branches];
    this.newBranches = [];
    this.loadingEdit = true;
    if (this.isEditOrg) {
      this.handleOrgSave(this.orgService.update(this.editAddOrg));
    } else {
      this.handleOrgSave(this.orgService.create(this.editAddOrg));
    }
    //   if (this.isEditOrg) {
    //     this.orgService.update(this.editAddOrg).pipe(takeUntil(this.destroy$)).subscribe({
    //       next: (updatedOrg: Organization) => {
    //         const list = [...this.organizations()];
    //         const ix = list.findIndex(o => o.id === updatedOrg.id);
    //         if (ix >= 0) list[ix] = updatedOrg; else list.unshift(updatedOrg);
    //         this.organizations.set(list);
    //         this.editModalOpen = false;
    //         this.loadingEdit = false;
    //         this.branchCurrentPage = 1;
    //       },
    //       error: () => { this.editError = 'Failed to save organization. Please try again.'; this.loadingEdit = false; }
    //     });
    // }else{
    //    this.orgService.create(this.editAddOrg).pipe(takeUntil(this.destroy$)).subscribe({
    //       next: (createdOrg: Organization) => {
    //         const list = [...this.organizations()];
    //         const ix = list.findIndex(o => o.id === createdOrg.id);
    //         if (ix >= 0) list[ix] = createdOrg; else list.unshift(createdOrg);
    //         this.organizations.set(list);
    //         this.editModalOpen = false;
    //         this.loadingEdit = false;
    //         this.branchCurrentPage = 1;
    //       },
    //       error: () => { this.editError = 'Failed to save organization. Please try again.'; this.loadingEdit = false; }
    //     });
    //     }
  }
  handleOrgSave(obs: Observable<Organization>) {
    obs.pipe(takeUntil(this.destroy$)).subscribe({
      next: (org) => {
        const list = [...this.organizations()];
        const ix = list.findIndex(o => o.id === org.id);
        if (ix >= 0) list[ix] = org; else list.unshift(org);
        this.organizations.set(list);
        this.editModalOpen = false;
        this.loadingEdit = false;
        this.branchCurrentPage = 1;
      },
      error: () => {
        this.editError = 'Failed to save organization. Please try again.';
        this.loadingEdit = false;
      }
    });
  }

  // === NEW: Open Add Modal ===
  openAddModal() {
    this.isEditOrg = false;
    this.editAddOrg = {
      id: uuidv7(),
      name: '',
      countryCode: '',
      currencyCode: '',
      branches: []
    };
    this.editError = '';
    this.branchFilter = '';
    this.branchCurrentPage = 1;
    this.editModalOpen = true;
    this.newBranches = [];
    this.editingBranchIds.clear();
    this.editingBranchPositions.clear();
  }
  removeOrg(org: Organization) {
    // if (!confirm('Are you sure you want to delete this organization? This action cannot be undone.')) {
    //   return;
    // }

    let deletedOrg = {
      id: org.id,
      name: org.name,
      countryCode: org.countryCode,
      currencyCode: org.currencyCode,
      branches: org.branches
    };

    this.orgService.delete(deletedOrg).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        const list = this.organizations().filter(o => o.id !== deletedOrg.id);
        this.organizations.set(list);
        this.totalCount.set(this.totalCount() - 1);

        // Fix pagination if needed
        if (this.pageIndex() >= this.totalPages()) {
          this.pageIndex.set(Math.max(0, this.totalPages() - 1));
        }

        this.fetchOrganizations();
      },
      error: (err) => {
        console.error('Delete failed', err);
        alert(err?.error?.message || 'Failed to delete organization. Please try again.');
      }
    });
  }


  applyFilter(event: any) { this.filterValue.set(event.target.value); this.pageIndex.set(0); this.fetchOrganizations(); }
  sortBy(column: string) { if (this.sortColumn() === column) this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc'); else { this.sortColumn.set(column); this.sortDirection.set('asc'); } this.fetchOrganizations(); this.goToPage(0); }
  goToPage(index: number) { if (index < 0 || index >= this.totalPages()) return; this.pageIndex.set(index); this.fetchOrganizations(); }
  changePageSize(size: number) { this.pageSize.set(+size); this.pageIndex.set(0); this.fetchOrganizations(); }
  confirmPageJump(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = input.value.trim();
    const page = Number(value) - 1;

    // Validate input
    if (!Number.isFinite(page) || page < 0 || page >= this.totalPages()) {
      // Reset to current valid page
      input.value = String(this.pageIndex() + 1);
      this.editingPage = false;
      return;
    }

    // Apply page jump
    this.pageIndex.set(page);
    this.fetchOrganizations();
    this.editingPage = false;
  }

  trackById(index: number, item: Organization) { return item.id; }
  trackByBranchId(index: number, item: Branch) { return item.id; }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }


}
