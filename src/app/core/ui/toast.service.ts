// src/app/core/ui/toast.service.ts
import { Injectable } from '@angular/core';

type ToastKind = 'success' | 'error' | 'info';

@Injectable({ providedIn: 'root' })
export class ToastService {
  show(message: string, kind: ToastKind = 'info', ms = 2500) {
    const el = document.createElement('div');
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.textContent = message;

    const bg =
      kind === 'success' ? '#1e88e5' :
      kind === 'error'   ? '#dc2626' : '#0f172a';

    el.style.cssText = [
      'position:fixed','right:20px','top:20px','z-index:2000',
      'padding:12px 18px','border-radius:12px',
      'box-shadow:0 6px 18px rgba(2,8,23,.25)',
      'font-weight:700','color:#fff','font-size:14px',
      `background:${bg}`,
      'opacity:0','transform:translateY(-8px)','transition:.2s ease'
    ].join(';');

    document.body.appendChild(el);
    requestAnimationFrame(() => { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; });

    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(-8px)';
      setTimeout(() => el.remove(), 200);
    }, ms);
  }
}
