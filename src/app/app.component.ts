import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import {
  Router,
  RouterOutlet,
  NavigationStart,
  NavigationEnd,
  NavigationCancel,
  NavigationError,
} from '@angular/router';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { LoaderService } from './shared/loading/loader.service';
import { LoadingOverlayComponent } from './shared/loading/loading-overlay.component';
import { ToastHostComponent } from './shared/interfaces/toast/toast-host.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, 
    RouterOutlet,
    LoadingOverlayComponent,
    ToastHostComponent,
  ],
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
  isLoading$!: Observable<boolean>;
  loaderLabel$!: Observable<string>;

  private readonly router = inject(Router);
  private readonly loader = inject(LoaderService);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    // 1. ELIMINAMOS LA CAPTURA MANUAL DE TOKEN AQUÍ
    // Porque ahora el LoginComponent se encarga de recibir ?auth=...
    // y guardarlo correctamente.

    // 2. ELIMINAMOS EL REDIRECCIONAMIENTO AL 4201
    // El 'authGuard' en app.routes.ts se encargará de mandar al usuario
    // a '/login' (en el puerto 4200) si no hay sesión.

    // 3. LÓGICA DEL LOADER PARA NAVEGACIÓN (Mantenemos tu lógica corregida)
    this.isLoading$ = this.loader.isLoading$;
    this.loaderLabel$ = this.loader.label$;

    this.router.events
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((ev) => {
        if (ev instanceof NavigationStart) {
          // Usamos setTimeout para evitar el error ExpressionChangedAfterItHasBeenCheckedError
          setTimeout(() => {
            this.loader.startNavigation('Cargando…');
          });
        } else if (
          ev instanceof NavigationEnd ||
          ev instanceof NavigationCancel ||
          ev instanceof NavigationError
        ) {
          setTimeout(() => {
            this.loader.endNavigation();
          });
        }
      });
  }
}