import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class HomeComponent {
  kpis = [
    { value: 12,  label: 'Total Roles',         icon: 'verified_user',   color: 'blue'   },
    { value: 248, label: 'Usuarios Activos',    icon: 'group',           color: 'orange' },
    { value: 8,   label: 'Módulos',             icon: 'widgets',         color: 'turq'   },
    { value: 156, label: 'Accesos Configurados', icon: 'lock_open',        color: 'green'  },
  ];

  activity = [
    { title: 'Nuevo rol creado', desc: 'Administrador de Sistemas', time: 'Hace 2 horas' },
    { title: 'Usuario asignado', desc: 'María González → Supervisor', time: 'Hace 4 horas' },
    { title: 'Módulo actualizado', desc: 'Sistema de Reportes', time: 'Hace 1 día' },
    { title: 'Acceso modificado', desc: 'Rol Operador actualizado', time: 'Hace 2 días' },
  ];

  constructor(private router: Router) {}

  goToShell(): void {
    // Redirige a la raíz o al shell del sistema
    this.router.navigate(['/']); 
  }
}