import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ModuloService } from '../../core/services/modulo.service'; // Ajusta la ruta si es necesario

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class HomeComponent implements OnInit {
  // Mantenemos la estructura pero inicializamos los valores en 0
  kpis = [
    {
      key: 'roles',
      value: 0,
      label: 'Total Roles',
      icon: 'verified_user',
      color: 'blue',
    },
    {
      key: 'users',
      value: 0,
      label: 'Usuarios Activos',
      icon: 'group',
      color: 'orange',
    },
    {
      key: 'modulos',
      value: 0,
      label: 'Módulos',
      icon: 'widgets',
      color: 'turq',
    },
    {
      key: 'accesos',
      value: 0,
      label: 'Accesos Configurados',
      icon: 'lock_open',
      color: 'green',
    },
  ];

  activity = [
    {
      title: 'Nuevo rol creado',
      desc: 'Administrador de Sistemas',
      time: 'Hace 2 horas',
    },
    {
      title: 'Usuario asignado',
      desc: 'María González → Supervisor',
      time: 'Hace 4 horas',
    },
    {
      title: 'Módulo actualizado',
      desc: 'Sistema de Reportes',
      time: 'Hace 1 día',
    },
    {
      title: 'Acceso modificado',
      desc: 'Rol Operador actualizado',
      time: 'Hace 2 días',
    },
  ];

  constructor(
    private router: Router,
    private api: ModuloService,
  ) {}

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    // forkJoin lanza las 4 peticiones en paralelo
    forkJoin({
      roles: this.api.getStatsRoles(),
      users: this.api.getStatsUsers(),
      modulos: this.api.getModulosAdmin(),
      accesos: this.api.getStatsAccesos(),
    }).subscribe({
      next: (res) => {
        this.updateKpi('roles', res.roles.length);
        this.updateKpi('users', res.users.length);
        this.updateKpi('modulos', res.modulos.length);
        this.updateKpi('accesos', res.accesos.length);
      },
      error: (err) => {
        console.error('Error al cargar estadísticas del dashboard:', err);
      },
    });
  }

  private updateKpi(key: string, newValue: number): void {
    const kpi = this.kpis.find((k) => k.key === key);
    if (kpi) {
      kpi.value = newValue;
    }
  }

  goToShell(): void {
    // Te lleva de vuelta a la cuadrícula de módulos (Fuera del Layout con Sidebar)
    this.router.navigate(['/app/application-management/setup']);
  }
}
