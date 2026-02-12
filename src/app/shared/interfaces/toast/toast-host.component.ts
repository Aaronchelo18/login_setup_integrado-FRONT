import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ToastMsg, ToastService } from './toast.service';

@Component({
  selector: 'app-toast-host',
  standalone: true,
  imports: [CommonModule],
  template: `
  <div class="toasts">
    <div class="toast" *ngFor="let t of items" [class.ok]="t.type==='success'"
         [class.err]="t.type==='error'" [class.info]="t.type==='info'">
      {{ t.text }}
    </div>
  </div>`,
  styles: [`
  .toasts{position:fixed;right:16px;bottom:16px;display:grid;gap:10px;z-index:9999}
  .toast{background:#111827;color:#fff;padding:10px 14px;border-radius:10px;box-shadow:0 8px 20px rgba(2,6,23,.2);opacity:.98}
  .toast.ok{background:#065f46}      /* verde */
  .toast.err{background:#7f1d1d}     /* rojo */
  .toast.info{background:#1e3a8a}    /* azul */
  `]
})
export class ToastHostComponent implements OnDestroy {
  items: ToastMsg[] = [];
  private sub = new Subscription();
  constructor(private toast: ToastService) {
    this.sub.add(this.toast.stream.subscribe(t => {
      this.items = [...this.items, t];
      setTimeout(() => this.items = this.items.filter(x => x.id !== t.id), t.timeout);
    }));
  }
  ngOnDestroy(){ this.sub.unsubscribe(); }
}
