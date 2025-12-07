import { NgStyle } from '@angular/common';
import { Component, computed, Input, signal } from '@angular/core';

@Component({
  selector: 'app-skeleton-loader',
  imports: [NgStyle],
  templateUrl: './skeleton-loader.html',
  styleUrl: './skeleton-loader.css'
})
export class SkeletonLoader {

// 🔹 Internal signals
  private rowsSig = signal<number>(3);
  private heightSig = signal<string>('35px');
  private radiusSig = signal<string>('7px');

  // 🔹 Create array for @for
  readonly rowsArray = computed(() => Array.from({ length: this.rowsSig() }, (_, i) => i));

  // ------------ Inputs ------------
  @Input() set rows(v: number | null | undefined) {
    this.rowsSig.set(Math.max(1, Number(v ?? 3)));
  }
  get rows() { return this.rowsSig(); }

  @Input() set height(v: string | undefined) {
    this.heightSig.set(v ?? '35px');
  }
  get height() { return this.heightSig(); }

  @Input() set radius(v: string | undefined) {
    this.radiusSig.set(v ?? '7px');
  }
  get radius() { return this.radiusSig(); }

 



  // Style builder for rows
  rowStyle(index: number) {
    return {
      height: this.height,
      borderRadius: this.radius,
      width: '100%',
    };
  }
}
