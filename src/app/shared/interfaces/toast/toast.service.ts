import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export type ToastType = 'success' | 'error' | 'info'| 'warning';
export interface ToastMsg { id: number; type: ToastType; text: string; timeout: number; }

@Injectable({ providedIn: 'root' })
export class ToastService {
  private _id = 0;
  public stream = new Subject<ToastMsg>();

  show(text: string, type: ToastType = 'info', timeout = 2500) {
    this.stream.next({ id: ++this._id, type, text, timeout });
  }
  success(text: string, timeout = 2200) { this.show(text, 'success', timeout); }
  error(text: string, timeout = 3000) { this.show(text, 'error', timeout); }
  info(text: string, timeout = 2500) { this.show(text, 'info', timeout); }
  warning(text: string, timeout = 3000) { this.show(text, 'warning', timeout); }
}
