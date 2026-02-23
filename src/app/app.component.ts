import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

import { ToastHostComponent } from './shared/interfaces/toast/toast-host.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, 
    RouterOutlet,
    ToastHostComponent,
  ],
  templateUrl: './app.component.html',
})
export class AppComponent {
  // Componente simplificado: sin lógica de loading ni interceptores de navegación
  constructor() {}
}