// src/app/pages/setup/roles/components/roles-hero/roles-hero.component.ts
import { Component, EventEmitter, Input, Output, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
}
