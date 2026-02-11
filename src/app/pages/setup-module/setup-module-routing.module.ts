import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SetupModuloComponent } from './setup-module.component';

const routes: Routes = [{ path: '', component: SetupModuloComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SetupModuloRoutingModule {}
