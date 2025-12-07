import { Component } from '@angular/core';
import { DecimalPipe, NgFor, NgIf } from '@angular/common';

@Component({
  selector: 'app-attendance-table',
  standalone: true,
  imports: [NgFor, NgIf,DecimalPipe],
  template: `
    <div class="header">
      <button (click)="prevMonth()">◀</button>

      <span class="title">
        {{ currentYear }} - {{ (currentMonth + 1) | number:'2.0' }}
      </span>

      <button (click)="nextMonth()">▶</button>
    </div>

    <table>
      <thead>
        <tr>
          <th>Student</th>
          <th *ngFor="let d of daysInMonth">{{ d }}</th>
        </tr>
      </thead>

      <tbody>
        <tr *ngFor="let student of students">
          <td>{{ student.name }}</td>

          <td *ngFor="let d of daysInMonth"
              (click)="toggleAttendance(student, d)"
              [class.present]="student.attendance[d]">
            {{ student.attendance[d] ? '✓' : '' }}
          </td>
        </tr>
      </tbody>
    </table>
  `,
  styles: [`
    .header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 12px;
    }

    .title {
      font-size: 18px;
      font-weight: bold;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      text-align: center;
    }

    th, td {
      border: 1px solid #ccc;
      padding: 6px;
    }

    td.present {
      background-color: #c8f7c5;
      font-weight: bold;
      cursor: pointer;
    }

    td:hover {
      background-color: #eee;
      cursor: pointer;
    }

    th {
      background: #f4f4f4;
    }
  `]
})
export class AttendanceTableComponent {

  currentYear = new Date().getFullYear();
  currentMonth = new Date().getMonth(); // 0 = January

  students = [
    { name: 'Alice', attendance: {} as Record<number, boolean> },
    { name: 'Bob', attendance: {} as Record<number, boolean> },
    { name: 'Charlie', attendance: {} as Record<number, boolean> },

    { name: 'Charlie', attendance: {} as Record<number, boolean> }
  ];

  get daysInMonth(): number[] {
    const total = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  prevMonth() {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
  }

  nextMonth() {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
  }

  toggleAttendance(student: any, day: number) {
    student.attendance[day] = !student.attendance[day];
  }

}
