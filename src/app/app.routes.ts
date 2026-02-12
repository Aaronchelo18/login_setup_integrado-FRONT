import { Routes } from '@angular/router';
import { MainLayoutComponent } from './components/layouts/main-layout.component';
import { RolesPage } from './pages/setup/roles/roles.page';
import { RolesAccessListComponent } from './pages/setup/access/components/roles-access-list/roles-access-list.component';
import { RoleAppsPage } from './pages/setup/access/pages/role-apps/role-apps.page';
import { RoleAccessTreePage } from './pages/setup/access/pages/role-access-tree/role-access-tree.page';
import { UsersListPage } from './pages/management/users/users-list.page';
import { GestionAccesosComponent } from './pages/userprograma/gestion-accesos.component';
import { AccessReportsPage } from './pages/reports/access-reports.page';
import { DynamicPortalComponent } from './pages/portal/dynamic-portal.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'setup',
    pathMatch: 'full',
  },

  // Setup: landing independiente (sin header ni sidebar)
  {
    path: 'setup',
    loadChildren: () =>
      import('./pages/setup-module/setup-module.module')
        .then(m => m.SetupModuloModule),
  },

  // Todo el sistema dentro de UN SOLO layout (sidebar no se destruye al navegar)
  {
    path: '',
    component: MainLayoutComponent,
    children: [

      // Setup / Accesos
      { path: 'setup/accesos/roles', component: RolesPage },
      { path: 'setup/accesos', component: RolesAccessListComponent },
      { path: 'setup/accesos/role/:idRol/apps', component: RoleAppsPage },
      { path: 'setup/accesos/role/:idRol/root/:idRoot', component: RoleAccessTreePage },

      // Management
      { path: 'management/users', component: UsersListPage },

      // Otros
      { path: 'userprograma/gestion-accesos', component: GestionAccesosComponent },
      { path: 'reports/access-reports', component: AccessReportsPage },
    ],
  },

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
