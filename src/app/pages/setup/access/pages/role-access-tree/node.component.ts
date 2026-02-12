import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-node',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="node">
      <label>
        <input type="checkbox" [checked]="node.checked" (change)="onToggle($event)" />
        <span>{{ node.nombre }}</span>
      </label>
      <div class="children" *ngIf="node.children?.length">
        <app-node *ngFor="let c of node.children" [node]="c"></app-node>
      </div>
    </div>
  `,
  styles: [`
    .node { padding: 6px 8px; border-left: 2px dotted #dbe4ff; margin-left: 8px; }
    label { display: flex; gap: 8px; align-items: center; font-weight: 600; color: #0b2a67; }
    .children { margin-left: 14px; margin-top: 4px; }
  `]
})
export class NodeComponent {
  @Input() node: any;
  @Output() change = new EventEmitter<void>();

  onToggle(e: Event) {
    this.node.checked = (e.target as HTMLInputElement).checked;
    this.change.emit();
  }
}
