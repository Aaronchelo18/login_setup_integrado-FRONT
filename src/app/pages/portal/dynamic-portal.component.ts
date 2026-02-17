// src/app/pages/portal/dynamic-portal.component.ts
import { Component, EnvironmentInjector, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

// Páginas reales
import { HomeComponent } from '../home/home.component';
import { ModuleComponent } from '../module/module.component'; // <-- Módulos

type Ctor = any;

// 🔑 Slugs soportados por el portal dinámico
const PAGE_MAP: Record<string, Ctor> = {
  home: HomeComponent,
  dashboard: HomeComponent,          // alias /setup/dashboard
  modulo: ModuleComponent,           // nuevo
  modulos: ModuleComponent,          // alias opcional
};

@Component({
  standalone: true,
  selector: 'app-dynamic-portal',
  imports: [CommonModule],
  template: `
    <ng-container *ngIf="component; else notFound"
                  [ngComponentOutlet]="component"
                  [ngComponentOutletInjector]="envInjector">
    </ng-container>

    <ng-template #notFound>
      <div style="padding:16px">
        <h3>Pantalla no disponible</h3>
        <p>La ruta <code>{{ module }}</code>/<code>{{ page }}</code> no está mapeada.</p>
      </div>
    </ng-template>
  `,
})
export class DynamicPortalComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  envInjector = inject(EnvironmentInjector);

  module = '';
  page = 'home';
  component: Ctor | null = null;

  constructor() {
    this.route.paramMap.subscribe((pm) => {
      this.module = (pm.get('module') || '').trim();
      this.page = (pm.get('page') || 'home').trim().toLowerCase();

      if (!this.page) {
        this.router.navigate(['/', this.module, 'home']);
        return;
      }

      this.component = PAGE_MAP[this.page] ?? null;
    });
  }
}
