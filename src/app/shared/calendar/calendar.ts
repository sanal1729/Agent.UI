import {
    Component,
    signal,
    computed,
    input,
    Output,
    EventEmitter
} from '@angular/core';
import { NgFor, NgClass, NgIf } from '@angular/common';
import { DateTime, Info } from 'luxon';

export type CalendarSelectionMode = 'single' | 'multi' | 'range';
export type CalendarView = 'days' | 'months' | 'years';

interface CalendarDay {
    date: DateTime;
    inCurrentMonth: boolean;
}

interface CalendarMonth {
    label: string;
    date: DateTime;
}

interface CalendarWeek {
    weekNumber: number;
    days: CalendarDay[];
}

@Component({
    selector: 'app-calendar',
    standalone: true,
    imports: [NgFor, NgClass, NgIf],
    template: `
<div class="calendar"
     [style.width.px]="width()"
     [style.height.px]="height()"
     [style.--scale]="scale()">

   

  <!-- Header -->
  <div class="header">
    <button (click)="prev()" aria-label="Previous">&lt;</button>
    <div class="title">
      <span class="month-title" (click)="switchToMonths()" role="button">
        {{ current().toFormat('LLLL') }}
      </span>
      <span class="year-title" (click)="switchToYears()" role="button">
        {{ current().year }}
      </span>
    </div>
    <button (click)="next()" aria-label="Next">&gt;</button>
  </div>

  <!-- Weekdays -->
  <div class="weekdays" *ngIf="view() === 'days'">
    <div class="week-number">Wk</div>
    <div *ngFor="let w of weekDays()">{{ w }}</div>
  </div>

  <!-- DAYS VIEW -->
  <div class="days" *ngIf="view() === 'days'">
    <ng-container *ngFor="let week of weeksWithDays()">
      <div class="week-row">
        <div class="week-number">{{ week.weekNumber }}</div>
        <div *ngFor="let day of week.days"
             class="day"
             [ngClass]="{
               'not-current': !day.inCurrentMonth,
               'today': isToday(day.date),
               'selected': isSelected(day.date),
               'range-start': isRangeStart(day.date),
               'range-end': isRangeEnd(day.date),
               'in-range': isInRange(day.date),
               'disabled': isDisabled(day.date),
             }"
             (click)="selectDay(day.date)"
             (contextmenu)="onRightClick($event, day.date)"
             role="gridcell"
             [attr.aria-label]="day.date.toFormat('D')">
          <div class="circle" [style.background]="getLegendColor(day.date) || undefined"
               [title]="getLegendColor(day.date)?getLegendInfo(day.date).join(', ') : ''">
            {{ day.date.day }}
          </div>
          <div class="pipe middle" *ngIf="isInRange(day.date)"></div>
          <div class="pipe start" *ngIf="isRangeStart(day.date) && rangeEnd()"></div>
          <div class="pipe end" *ngIf="isRangeEnd(day.date) && rangeStart()"></div>
        </div>
      </div>
    </ng-container>
  </div>

  <!-- MONTHS VIEW -->
  <div class="grid months" *ngIf="view() === 'months'">
    <div *ngFor="let m of months()"
         class="item"
         [ngClass]="{ 'current': isCurrentMonth(m.date), 'selected-month': isSelectedMonth(m.date) }"
         (click)="chooseMonth(m.date)"
         role="button">
      {{ m.label }}
    </div>
  </div>

  <!-- YEARS VIEW -->
  <div class="grid years" *ngIf="view() === 'years'">
    <div *ngFor="let y of years()"
         class="item"
         [ngClass]="{ 'current': isCurrentYear(y), 'selected-year': isSelectedYear(y) }"
         (click)="chooseYear(y)"
         role="button">
      {{ y }}
    </div>
  </div>

</div>
  `,
    styles: [`
:host { display:block; }
.calendar { display:flex; flex-direction:column; border:1px solid #ddd; border-radius:10px; overflow:hidden; font-family:system-ui; font-size:calc(14px * var(--scale)); background:white; }
.header { display:flex; align-items:center; justify-content:space-between; padding:calc(8px * var(--scale)); background:#fafafa; border-bottom:1px solid #eee; gap:8px; }
.header button { background:transparent; border:none; cursor:pointer; font-size:calc(18px * var(--scale)); }

.weekdays { display:grid; grid-template-columns: 40px repeat(7, 1fr); padding:calc(8px * var(--scale)) 0; background:#f5f5f5; border-bottom:1px solid #eee; text-align:center; font-weight:600; }
.week-number { display:flex; align-items:center; justify-content:center; font-weight:600; color: #555; }

.days { display:flex; flex-direction:column; gap:calc(2px * var(--scale)); padding:calc(6px * var(--scale)); }
.week-row { display:grid; grid-template-columns: 40px repeat(7, 1fr); gap:calc(6px * var(--scale)); align-items: center; }

.day { position:relative; display:flex; align-items:center; justify-content:center; min-height:calc(40px * var(--scale)); user-select:none; box-sizing:border-box; cursor:pointer; }
.circle { width:calc(34px * var(--scale)); height:calc(34px * var(--scale)); display:flex; align-items:center; justify-content:center; border-radius:50%; z-index:3; transition:background .12s, color .12s, transform .08s; }

.not-current { opacity: .35; }
.day:not(.in-range):not(.range-start):not(.range-end):hover .circle { background:#00bcd4; color:black; transform:scale(1.03); }

.pipe { position:absolute; left:0; right:0; height:calc(50% * var(--scale)); background:rgba(0,188,212,0.25); top:50%; transform:translateY(-50%); z-index:1; border-radius:calc(6px * var(--scale)); }
.pipe.start { left:50%; right:0; border-top-right-radius:calc(6px * var(--scale)); border-bottom-right-radius:calc(6px * var(--scale)); }
.pipe.end { left:0; right:50%; border-top-left-radius:calc(6px * var(--scale)); border-bottom-left-radius:calc(6px * var(--scale)); }
.in-range { font-weight:bold; z-index:1; border-radius:calc(6px * var(--scale)); }
.in-range .circle { background:transparent !important; color:inherit; }

.range-start .circle, .range-end .circle, .selected .circle { background:#00bcd4 !important; color:black !important; font-weight:700; }
.range-start, .range-end { z-index:4; }

.today .circle { border:calc(2px * var(--scale)) solid #008fa1; background:white; color:black; }
.today.selected .circle { border:none !important; background:#00bcd4 !important; color:black !important; }
.today.in-range .circle { border:none !important; background:transparent !important; color:black; }
.today.range-start .circle, .today.range-end .circle { border:none !important; background:#00bcd4 !important; color:black; }

.grid { padding:calc(8px * var(--scale)); flex:1; display:grid; gap:calc(8px * var(--scale)); }
.grid.months { grid-template-columns:repeat(3,1fr); grid-auto-rows:minmax(48px,auto); }
.grid.years { grid-template-columns:repeat(4,1fr); grid-auto-rows:minmax(48px,auto); }

.item { display:flex; align-items:center; justify-content:center; cursor:pointer; border-radius:calc(8px * var(--scale)); padding:calc(8px * var(--scale)); transition:background .12s, transform .08s; }
.item:hover { background:rgba(0,188,212,0.12); transform:translateY(-1px); border-radius:50%; }
.current { font-weight:700; color:black; border:calc(2px * var(--scale)) solid #008fa1; border-radius:50%; }

.day.disabled { opacity:0.35; pointer-events:none; }

.title { display:flex; gap:calc(6px * var(--scale)); font-weight:600; cursor:pointer; }
  `]
})
export class Calendar {

    /* Inputs */
    width = input<number>(430);
    height = input<number>(430);
    mode = input<CalendarSelectionMode>('single');
    minDay = input<DateTime | null>(null);
    maxDay = input<DateTime | null>(null);
    disabledDates = input<DateTime[]>([]);
    startOfWeek = input<number>(1); // 0=Sun..6=Sat
    weekendDays = input<number[]>([0, 6]); // 0=Sun..6=Sat
    legendDates = input<{ date: DateTime; color?: string | null; info?: string[] | [] }[]>([]);

    /* Outputs */
    @Output() selectedDatesChange = new EventEmitter<DateTime[]>();
    @Output() rangeChange = new EventEmitter<{ start: DateTime | null; end: DateTime | null }>();

    /* Internal State */
    view = signal<CalendarView>('days');
    current = signal(DateTime.local().startOf('month'));
    selectedDates = signal<DateTime[]>([]);
    rangeStart = signal<DateTime | null>(null);
    rangeEnd = signal<DateTime | null>(null);

    /* Normalize startOfWeek to zero-based (0=Sun..6=Sat) */
    private get startOfWeekZeroBased() {
        return this.startOfWeek() % 7; // 1=Mon → 1, 7=Sun → 0
    }

    /* Weekdays headers */
    weekDays = computed(() => {
        const days = Info.weekdaysFormat('short'); // Mon..Sun
        const sundayFirst = [...days.slice(6), ...days.slice(0, 6)]; // Sun..Sat
        const start = this.startOfWeekZeroBased;
        return [...sundayFirst.slice(start), ...sundayFirst.slice(0, start)];
    });

    /* Scale for responsiveness */
    scale = computed(() => {
        const base = 375;
        const min = Math.max(160, Math.min(this.width(), this.height()));
        return Math.max(0.5, Math.min(2.5, min / base));
    });

    /* Days grid */
    days = computed<CalendarDay[]>(() => {
        const month = this.current();
        const first = month.startOf('month');
        const luxonWeekdayToZeroBased = (wd: number) => wd % 7; // Mon=1..Sun=0
        const offset = (luxonWeekdayToZeroBased(first.weekday) - this.startOfWeekZeroBased + 7) % 7;

        const total = month.daysInMonth;

        const list: CalendarDay[] = [];
        const prev = month.minus({ months: 1 });
        const prevCount = prev.daysInMonth;
        for (let i = offset - 1; i >= 0; i--) {
            list.push({ date: prev.set({ day: prevCount - i }).startOf('day'), inCurrentMonth: false });
        }
        for (let d = 1; d <= total; d++) {
            list.push({ date: month.set({ day: d }).startOf('day'), inCurrentMonth: true });
        }
        const next = month.plus({ months: 1 });
        let nextDay = 1;
        while (list.length < 42) {
            list.push({ date: next.set({ day: nextDay++ }).startOf('day'), inCurrentMonth: false });
        }
        return list;
    });

    /* Weeks with ISO numbers */
    weeksWithDays = computed<CalendarWeek[]>(() => {
        const allDays = this.days();
        const weeks: CalendarWeek[] = [];
        for (let i = 0; i < 6; i++) {
            const weekDays = allDays.slice(i * 7, (i + 1) * 7);
            if (weekDays.length) {
                const firstDayOfWeek = weekDays[0].date;
                let weekNumber = firstDayOfWeek.weekNumber;
                if (this.startOfWeekZeroBased !== 1) {
                    const diff = (firstDayOfWeek.weekday % 7 - this.startOfWeekZeroBased + 7) % 7;
                    weekNumber = firstDayOfWeek.minus({ days: diff }).weekNumber;
                }
                weeks.push({ weekNumber, days: weekDays });
            }
        }
        return weeks;
    });

    /* Months & Years */
    months = computed<CalendarMonth[]>(() =>
        Array.from({ length: 12 }, (_, i) => {
            const m = this.current().set({ month: i + 1 }).startOf('month');
            return { label: m.toFormat('LLLL'), date: m };
        })
    );

    years = computed<number[]>(() => {
        const y = this.current().year;
        return Array.from({ length: 16 }, (_, i) => y - 8 + i);
    });

    /* Navigation */
    switchToMonths() { this.view.set('months'); }
    switchToYears() { this.view.set('years'); }

    chooseMonth(d: DateTime) { this.current.set(d.startOf('month')); this.view.set('days'); }
    chooseYear(y: number) { this.current.update(c => c.set({ year: y })); this.view.set('months'); }
    prev() {
        if (this.view() === 'days') this.current.update(c => c.minus({ months: 1 }));
        else if (this.view() === 'months') this.current.update(c => c.minus({ years: 1 }));
        else this.current.update(c => c.minus({ years: 16 }));
    }
    next() {
        if (this.view() === 'days') this.current.update(c => c.plus({ months: 1 }));
        else if (this.view() === 'months') this.current.update(c => c.plus({ years: 1 }));
        else this.current.update(c => c.plus({ years: 16 }));
    }

    onRightClick(event: MouseEvent, date: DateTime) {
        event.preventDefault(); // prevent default context menu

        // Example: alert the date or emit an event
        console.log('Right-clicked date:', date.toISODate());

        // You could emit an Output
        // this.rightClick.emit(date);
    }


    /* Selection */
    selectDay(date: DateTime) {
        console.log('clicked date:', date.toISODate());
        if (this.isDisabled(date)) return;
        const mode = this.mode();

        if (mode === 'single') {
            const selected = this.selectedDates()[0];
            const isSame = selected && this.same(selected, date);

            if (isSame) {
                this.selectedDates.set([]);
                this.rangeStart.set(null);
                this.rangeEnd.set(null);
                this.selectedDatesChange.emit([]);
                this.rangeChange.emit({ start: null, end: null });
                return;
            }

            this.selectedDates.set([date.startOf('day')]);
            this.rangeStart.set(null);
            this.rangeEnd.set(null);
            this.selectedDatesChange.emit(this.selectedDates());
            this.rangeChange.emit({ start: null, end: null });
            return;
        }


        if (mode === 'multi') {
            const exists = this.selectedDates().some(d => this.same(d, date));
            this.selectedDates.update(arr =>
                exists ? arr.filter(x => !this.same(x, date)) : [...arr, date.startOf('day')]
            );
            this.selectedDatesChange.emit(this.selectedDates());
            this.rangeStart.set(null);
            this.rangeEnd.set(null);
            this.rangeChange.emit({ start: null, end: null });
            return;
        }

        if (mode === 'range') {
            const s = this.rangeStart(); const e = this.rangeEnd();
            if (!s) { this.rangeStart.set(date.startOf('day')); this.rangeEnd.set(null); }
            else if (!e) { const candidate = date.startOf('day'); if (candidate >= s) this.rangeEnd.set(candidate); else { this.rangeStart.set(candidate); this.rangeEnd.set(s); } }
            else { this.rangeStart.set(date.startOf('day')); this.rangeEnd.set(null); }
            this.rangeChange.emit({ start: this.rangeStart(), end: this.rangeEnd() });
            this.selectedDates.set([]);
            this.selectedDatesChange.emit(this.selectedDates());
        }
    }

    /* Utilities */
    same(a: DateTime, b: DateTime): boolean { return a.hasSame(b, 'day'); }
    isSelected(d: DateTime) { return this.selectedDates().some(x => this.same(x, d)); }
    isRangeStart(d: DateTime) { return this.rangeStart()?.hasSame(d, 'day') ?? false; }
    isRangeEnd(d: DateTime) { return this.rangeEnd()?.hasSame(d, 'day') ?? false; }
    isInRange(d: DateTime) { const s = this.rangeStart(); const e = this.rangeEnd(); if (!s || !e) return false; const ms = d.startOf('day').toMillis(); return ms > s.startOf('day').toMillis() && ms < e.startOf('day').toMillis(); }
    isToday(d: DateTime) { return d.hasSame(DateTime.local(), 'day'); }
    isCurrentMonth(d: DateTime) { const now = DateTime.local(); return d.month === now.month && d.year === now.year; }
    isSelectedMonth(d: DateTime) { return d.month === this.current().month && d.year === this.current().year; }
    isCurrentYear(y: number) { return y === DateTime.local().year; }
    isSelectedYear(y: number) { return y === this.current().year; }

    isDisabled(d: DateTime) {
        const minDay = this.minDay();
        const maxDay = this.maxDay();

        // Disable days outside min/max
        if ((minDay && d < minDay) || (maxDay && d > maxDay)) return true;

        // Disable explicitly disabled dates
        if (this.disabledDates().some(x => this.same(x, d))) return true;

        // Disable legend dates
        //   if (this.legendDates().some(x => this.same(x.date, d))) return true;

        return false;
    }


    isWeekend(d: DateTime) {
        const weekdayIndex = d.weekday % 7; // 0=Sun..6=Sat
        return this.weekendDays().includes(weekdayIndex);
    }


    getLegendColor(d: DateTime): string | null {
        const found = this.legendDates().find(l => this.same(l.date, d));

        // Default to 'grey' if the color is explicitly null or undefined, 
        // otherwise return the color or null if the date is not found.
        if (!found) {
            return null;
        }

        // Implement: "if color is null, grey by default"
        return found.color ?? 'grey';
    }

    getLegendInfo(d: DateTime): string[] {
        const found = this.legendDates().find(l => this.same(l.date, d));

        const infoData = found?.info;

        // Implement: "info is null or [] then 'no info'"
        if (infoData === null || infoData === undefined || infoData.length === 0) {
            return ['no info'];
        }

        return infoData;
    }
}