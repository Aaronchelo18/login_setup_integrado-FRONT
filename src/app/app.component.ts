import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import {
  Router, RouterOutlet,
  NavigationStart, NavigationEnd, NavigationCancel, NavigationError,
} from '@angular/router';
import { NgIf, AsyncPipe } from '@angular/common';
import { Observable } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { LoaderService } from './shared/loading/loader.service';
import { LoadingOverlayComponent } from './shared/loading/loading-overlay.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NgIf, AsyncPipe, LoadingOverlayComponent],
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
  isLoading$!: Observable<boolean>;
  loaderLabel$!: Observable<string>;

  private readonly router = inject(Router);
  private readonly loader = inject(LoaderService);
  private readonly destroyRef = inject(DestroyRef); // Necesario para takeUntilDestroyed

  ngOnInit(): void {
    // 1. CAPTURAR TOKEN DE LA URL (Sincronización entre puertos)
    const urlParams = new URLSearchParams(window.location.search);
    const authParam = urlParams.get('auth');

    if (authParam) {
      try {
        const data = JSON.parse(atob(authParam));
        localStorage.setItem('code5-access-token', data.access_token);
        localStorage.setItem('code5-authorization-token', data.authz_token);
        
        // Limpiamos la URL sin recargar la página
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (e) {
        console.error("Error procesando token de integración");
      }
    }

    // 2. VALIDACIÓN DE SESIÓN
    const token = localStorage.getItem('code5-access-token');
    if (!token) {
      window.location.href = 'http://localhost:4201/login';
      return;
    }

    // 3. LÓGICA DEL LOADER (Corregida para evitar error NG0203)
    this.isLoading$ = this.loader.isLoading$;
    this.loaderLabel$ = this.loader.label$;

    this.router.events
      .pipe(takeUntilDestroyed(this.destroyRef)) // Pasamos destroyRef aquí
      .subscribe((ev) => {
        if (ev instanceof NavigationStart) {
          this.loader.startNavigation('Cargando…');
        } else if (
          ev instanceof NavigationEnd ||
          ev instanceof NavigationCancel ||
          ev instanceof NavigationError
        ) {
          this.loader.endNavigation();
        }
      });
  }
}