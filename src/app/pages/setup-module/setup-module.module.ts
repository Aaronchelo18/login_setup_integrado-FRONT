import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SetupModuloRoutingModule } from './setup-module-routing.module';
import { SetupModuloComponent } from './setup-module.component';

@NgModule({
  declarations: [
    SetupModuloComponent
  ],
  imports: [
    CommonModule, // Necesario para *ngIf, *ngFor y el pipe | async
    SetupModuloRoutingModule
  ],
  /**
   * CUSTOM_ELEMENTS_SCHEMA es fundamental aquí para que Angular 
   * reconozca <iconify-icon> y no dispare errores de compilación.
   */
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SetupModuloModule { }