import { Injectable } from '@angular/core';
import { BehaviorSubject, Subscription, timer } from 'rxjs';
import { delay } from 'rxjs/operators'; // ✅ Importante

@Injectable({ providedIn: 'root' })
export class LoaderService {
  private readonly MIN_DELAY_MS = 900;     // evita flicker
  private readonly MAX_WAIT_MS = 15000;    // seguridad

  private _isLoading$ = new BehaviorSubject<boolean>(false);
  private _label$ = new BehaviorSubject<string>('Procesando…');

  /** * ✅ SOLUCIÓN AL ERROR NG0100:
   * Aplicamos delay(0) para diferir la notificación al siguiente ciclo.
   */
  isLoading$ = this._isLoading$.asObservable().pipe(delay(0));
  label$ = this._label$.asObservable().pipe(delay(0));

  private activeRequests = 0;
  private navInProgress = false;
  private startedAt = 0;

  private hideTimerSub?: Subscription;
  private maxSafetyTimerSub?: Subscription;

  startNavigation(label = 'Cargando…'): void {
    this.setLabel(label);
    this.resetHideTimers();
    this.navInProgress = true;
    this.startedAt = Date.now();
    this.setVisible(true);
    this.armMaxSafety();
  }

  endNavigation(): void {
    this.navInProgress = false;
    this.tryHide();
  }

  requestStarted(label?: string): void {
    if (label) this.setLabel(label);
    const wasIdle = this.activeRequests === 0 && !this.navInProgress;
    this.activeRequests++;
    if (wasIdle) {
      this.resetHideTimers();
      this.startedAt = Date.now();
      this.setVisible(true);
      this.armMaxSafety();
    }
  }

  requestEnded(): void {
    if (this.activeRequests > 0) this.activeRequests--;
    this.tryHide();
  }

  setLabel(label: string) { 
    this._label$.next(label); 
  }

  // ===== internos =====
  private setVisible(v: boolean) {
    if (this._isLoading$.value !== v) this._isLoading$.next(v);
  }

  private tryHide(): void {
    const ready = !this.navInProgress && this.activeRequests === 0;
    if (!ready) return;

    const elapsed = Date.now() - this.startedAt;
    if (elapsed >= this.MIN_DELAY_MS) {
      this.forceHide();
      return;
    }
    this.resetHideTimers();
    this.hideTimerSub = timer(this.MIN_DELAY_MS - elapsed).subscribe(() => this.forceHide());
  }

  private forceHide(): void {
    this.resetHideTimers();
    this.setVisible(false);
    this._label$.next('Procesando…');
    this.navInProgress = false;
    this.activeRequests = 0;
    this.startedAt = 0;
  }

  private armMaxSafety() {
    this.maxSafetyTimerSub?.unsubscribe();
    this.maxSafetyTimerSub = timer(this.MAX_WAIT_MS).subscribe(() => this.forceHide());
  }

  private resetHideTimers(): void {
    this.hideTimerSub?.unsubscribe(); this.hideTimerSub = undefined;
    this.maxSafetyTimerSub?.unsubscribe(); this.maxSafetyTimerSub = undefined;
  }
}