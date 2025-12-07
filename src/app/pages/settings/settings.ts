import { Component } from '@angular/core';
import { AccordionModule } from 'ngx-bootstrap/accordion';
import { Org } from '../org/org';
import { User } from '../user/user';
import { Calendar } from '../../shared/calendar/calendar';
import { DateTime } from 'luxon';
import { DecimalPipe, JsonPipe } from '@angular/common';
import { AttendanceTableComponent } from '../attendance-table-component/attendance-table-component';

@Component({
  selector: 'app-settings',
  imports: [AccordionModule, Org, User, Calendar, JsonPipe, DecimalPipe,AttendanceTableComponent],
  templateUrl: './settings.html',
  styleUrl: './settings.css'
})
export class Settings {
s :any
  selectedSingle: string[] = [];
  selectedMulti: string[] = [];
  range: { start: string | null; end: string | null } = { start: null, end: null };

  minDay = DateTime.local().minus({ days: 2});
  maxDay = DateTime.local().plus({ days: 10});

  disabled = [
    DateTime.local().plus({ days: 2 }),
    DateTime.local().plus({ days: 5 }),
  ];

  legend = [
     { date: DateTime.local().plus({ days: 7 }), info: ['Info 1', 'Info 2'] },
    { date: DateTime.local().plus({ days: 9 }), color: 'blue', info: ['Info 3'] },
    { date: DateTime.local().plus({ days: 1 }), color: 'red', info: ['Info 4'] },
    { date: DateTime.local().plus({ days: 3 }), color: 'green', info: ['Info 5'] },
  ];

  onSingleSelect(dates: DateTime[]) {
    this.selectedSingle = dates.map(d => d.toISODate()!);
  }

  onSelect(dates: DateTime[]) {
    this.s = dates.map(d => d!);
  }

  onMultiSelect(dates: DateTime[]) {
    this.selectedMulti = dates.map(d => d.toISODate()!);
  }

  onRangeChange(range: { start: DateTime | null; end: DateTime | null }) {
    this.range = {
      start: range.start?.toISODate() ?? null,
      end: range.end?.toISODate() ?? null
    };
  }



}
