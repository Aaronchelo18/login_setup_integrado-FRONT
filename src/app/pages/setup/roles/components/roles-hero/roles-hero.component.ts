import { Component, EventEmitter, Input, Output, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router'; // 1. Importamos el Router

type EstadoFiltro = 'todos'|'activo'|'inactivo';

@Component({
  selector: 'app-roles-hero',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './roles-hero.component.html',
  styleUrls: ['./roles-hero.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class RolesHeroComponent {
  @Input() estado: EstadoFiltro = 'todos';
  
  @Output() estadoChange = new EventEmitter<EstadoFiltro>();
  @Output() visualizar = new EventEmitter<void>();
  @Output() nuevo = new EventEmitter<void>();
  @Output() back = new EventEmitter<void>();

  // 2. Inyectamos el router en el constructor
  constructor(private router: Router) {}

  // 3. Modificamos la función para que navegue a la ruta que pides
  goBack(): void {
    this.router.navigate(['/app/application-management/dashboard']);
    this.back.emit(); // Opcional por si el padre aún quiere enterarse
  }
}