import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { authGuard } from './core/guards/auth.guard';
import { MainLayoutComponent } from './components/layouts/main-layout.component';
import { HomeComponent } from './pages/home/home.component';
import { RolesPage } from './pages/setup/roles/roles.page';
import { RolesAccessListComponent } from './pages/setup/access/components/roles-access-list/roles-access-list.component';
import { RoleAppsPage } from './pages/setup/access/pages/role-apps/role-apps.page';
import { RoleAccessTreePage } from './pages/setup/access/pages/role-access-tree/role-access-tree.page';
import { UsersListPage } from './pages/management/users/users-list.page';
import { GestionAccesosComponent } from './pages/userprograma/gestion-accesos.component';
import { AccessReportsPage } from './pages/reports/access-reports.page';
import { DynamicPortalComponent } from './pages/portal/dynamic-portal.component';

export const routes: Routes = [
  // 1. RUTA PÚBLICA
  { path: 'login', component: LoginComponent },

  // 2. PORTAL DE SELECCIÓN (Sin Sidebar - Pantalla Completa)
  { 
    path: 'app/application-management/setup', 
    canActivate: [authGuard],
    loadChildren: () => import('./pages/setup-module/setup-module.module').then(m => m.SetupModuloModule) 
  },

  // 3. SHELL PRINCIPAL (Con Sidebar y Header)
  {
    path: 'app',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      // Redirección por defecto al Dashboard
      { path: '', redirectTo: 'application-management/dashboard', pathMatch: 'full' },
      
      // ÁREA: Gestión de Aplicaciones
      {
        path: 'application-management',
        children: [
          { path: 'dashboard', component: HomeComponent }, 
          { path: 'access-control', component: RolesAccessListComponent },
          { path: 'reports', component: AccessReportsPage },
          { path: 'access/role/:idRol/apps', component: RoleAppsPage },
          { path: 'access/role/:idRol/root/:idRoot', component: RoleAccessTreePage },
        ]
      },

      // ÁREA: IAM (Identity and Access Management)
      {
        path: 'iam',
        children: [
          { path: 'roles', component: RolesPage },
          { path: 'user-access', component: GestionAccesosComponent },
          { path: 'role-assignment', component: UsersListPage },
        ]
      },

      // MÓDULOS DINÁMICOS
      { path: ':module', pathMatch: 'full', redirectTo: ':module/home' },
      { path: ':module/:page', component: DynamicPortalComponent },
    ],
  },

  // REDIRECCIONES GLOBALES
  { path: '', redirectTo: 'app/application-management/setup', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];