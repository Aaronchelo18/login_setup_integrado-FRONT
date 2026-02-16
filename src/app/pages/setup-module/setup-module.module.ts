import { NgModule } from '@angular/core';
import { SetupModuloRoutingModule } from './setup-module-routing.module';
import { SetupModuloComponent } from './setup-module.component';

@NgModule({
  imports: [
    SetupModuloRoutingModule, // Mantenemos las rutas del módulo
    SetupModuloComponent      // 👈 Correcto: se importa aquí porque es standalone
  ]
  // Ya no necesitas 'declarations' ni 'schemas' aquí
})
export class SetupModuloModule { }