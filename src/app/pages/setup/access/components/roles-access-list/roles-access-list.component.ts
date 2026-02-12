import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RoleService } from '../../../../../core/services/role/role.service';

type Role = { id_rol: number; nombre: string; estado: '0' | '1' };

@Component({
  selector: 'app-roles-access-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './roles-access-list.component.html',
  styleUrls: ['./roles-access-list.component.css']
})
export class RolesAccessListComponent implements OnInit {          // ← renombrado
  loading = true;
  error = '';
  filtro: 'Todos' | 'Activo' | 'Inactivo' = 'Todos';
  roles: Role[] = [];

  constructor(
    private rolesApi: RoleService,
    private router: Router                                        // ← inyectado
  ) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.rolesApi.getRoles().subscribe({
      next: (res: any) => {
        const list = res?.data ?? res ?? [];
        this.roles = list.map((r: any) => ({
          id_rol: Number(r.id_rol),
          nombre: String(r.nombre ?? ''),
          estado: (r.estado ? '1' : '0') as '0' | '1'
        }));
        this.loading = false;
      },
      error: () => {
        this.error = 'No se pudo cargar la lista.';
        this.loading = false;
      }
    });
  }

  listFiltered(): Role[] {
    if (this.filtro === 'Todos') return this.roles;
    const v = this.filtro === 'Activo' ? '1' : '0';
    return this.roles.filter(r => r.estado === v);
  }

  configurarAcceso(role: { id_rol:number; nombre:string; estado:'0'|'1' }) {
    this.router.navigate(
      ['/setup/accesos/role', role.id_rol, 'apps'],
      { state: { roleName: role.nombre, roleEstado: role.estado } }
    );
  }

  // Opcional: para *ngFor trackBy
  trackById(_: number, r: Role) { return r.id_rol; }
}
