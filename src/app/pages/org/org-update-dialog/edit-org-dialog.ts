import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

interface Branch {
  id?: string;
  name: string;
  code: string;
}

interface Organization {
  id?: string;
  name: string;
  countryCode: string;
  currencyCode: string;
  branches?: Branch[];
}

@Component({
  selector: 'app-edit-org-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>Edit Organization</h2>

    <div mat-dialog-content [formGroup]="form">
      <!-- Organization Info -->
      <section>
        <h3>Organization Info</h3>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" />
          <mat-error *ngIf="form.get('name')?.hasError('required') && form.get('name')?.touched">
            Name is required
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Country Code</mat-label>
          <input matInput formControlName="countryCode" />
          <mat-error *ngIf="form.get('countryCode')?.hasError('required') && form.get('countryCode')?.touched">
            Country code is required
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Currency Code</mat-label>
          <input matInput formControlName="currencyCode" />
          <mat-error *ngIf="form.get('currencyCode')?.hasError('required') && form.get('currencyCode')?.touched">
            Currency code is required
          </mat-error>
        </mat-form-field>
      </section>

      <!-- Branches Table -->
      <section>
        <h3>Branches</h3>
        <button mat-mini-fab color="primary" (click)="addBranch()" aria-label="Add Branch">
          <mat-icon>add</mat-icon>
        </button>

        <div *ngIf="branches.length > 0; else noBranches" class="branch-table-wrapper" formArrayName="branches">
          <table class="branch-table">
            <thead>
              <tr>
                <th>Branch Name</th>
                <th>Branch Code</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let branchCtrl of branches.controls; let i = index" [formGroupName]="i">
                <td>
                  <input matInput formControlName="name" placeholder="Branch Name" class="input-cell"/>
                  <div class="error" *ngIf="branchCtrl.get('name')?.hasError('required') && branchCtrl.get('name')?.touched">
                    Required
                  </div>
                </td>
                <td>
                  <input matInput formControlName="code" placeholder="Branch Code" class="input-cell"/>
                  <div class="error" *ngIf="branchCtrl.get('code')?.hasError('required') && branchCtrl.get('code')?.touched">
                    Required
                  </div>
                </td>
                <td>
                  <button mat-icon-button color="warn" (click)="removeBranch(i)">
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <ng-template #noBranches>
          <p>No branches yet. Click + to add.</p>
        </ng-template>
      </section>
    </div>

    <div mat-dialog-actions align="end">
      <button mat-stroked-button (click)="cancel()">Cancel</button>
      <button mat-flat-button color="primary" (click)="save()" [disabled]="form.invalid">Save</button>
    </div>
  `,
  styles: [`
    .full-width { width: 100%; margin-bottom: 12px; }
    .branch-table-wrapper { max-height: 250px; overflow-y: auto; margin-top: 12px; }
    .branch-table { width: 100%; border-collapse: collapse; }
    .branch-table th, .branch-table td { border: 1px solid #ddd; padding: 8px; }
    .branch-table th { background-color: #f5f5f5; text-align: left; }
    .input-cell { width: 100%; border: none; outline: none; padding: 4px; }
    .error { color: red; font-size: 12px; }
    section { margin-bottom: 16px; }
  `]
})
export class EditOrgDialog {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<EditOrgDialog>,
    @Inject(MAT_DIALOG_DATA) public data: Organization
  ) {
    this.form = this.fb.group({
      id: [data?.id || ''],
      name: [data?.name || '', Validators.required],
      countryCode: [data?.countryCode || '', Validators.required],
      currencyCode: [data?.currencyCode || '', Validators.required],
      branches: this.fb.array([])
    });

    if (data?.branches?.length) {
      data.branches.forEach(branch => this.addBranch(branch));
    }
  }

  get branches(): FormArray {
    return this.form.get('branches') as FormArray;
  }

  addBranch(branch?: Branch) {
    this.branches.push(this.fb.group({
      id: [branch?.id || ''],
      name: [branch?.name || '', Validators.required],
      code: [branch?.code || '', Validators.required]
    }));
  }

  removeBranch(index: number) {
    this.branches.removeAt(index);
  }

  save() {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }

  cancel() {
    this.dialogRef.close();
  }
}
