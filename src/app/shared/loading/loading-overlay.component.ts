import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-overlay',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="overlay"
      *ngIf="show"
      role="status"
      aria-live="polite"
      [style.--accent]="color"
    >
      <div class="loader" aria-hidden="true"></div>
      <p class="label">{{ label }}</p>
    </div>
  `,
  styleUrls: ['./loading-overlay.component.css'],
})
export class LoadingOverlayComponent {
  @Input() show = false;
  @Input() label = 'Cargando...';
  /** Azul institucional LAMB/UPeU */
  @Input() color = '#0F2D52';
}