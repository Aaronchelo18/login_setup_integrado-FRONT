import { Routes } from '@angular/router';
import { MainLayoutComponent } from './components/layouts/main-layout.component';
import { DynamicPortalComponent } from './pages/portal/dynamic-portal.component';

export const routes: Routes = [
  { 
    path: '', 
    redirectTo: 'setup', 
    pathMatch: 'full'
    // Nota: Las redirecciones estáticas no tienen queryParamsHandling, 
    // así que asegúrate de que el Login apunte directamente a /setup
  },

  // 2️⃣  Setup: landing independiente (sin header ni sidebar)
  {
    path: 'setup',
    loadChildren: () =>
      import('./pages/setup-module/setup-module.module')
        .then(m => m.SetupModuloModule),
  },

  // 3️⃣  Resto del sistema dentro del layout principal
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: ':module', pathMatch: 'full', redirectTo: ':module/home' },
      { path: ':module/:page', component: DynamicPortalComponent },
    ],
  },

  // 4️⃣  Cualquier ruta desconocida → vuelve al setup
  { path: '**', redirectTo: 'setup' },
];
