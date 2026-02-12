import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserManagementService } from '../../../core/services/management/user-management.service';
import { UserRow } from '../../../models/user/users.model';

type RoleRow = { id_rol: number; nombre: string };

@Component({
  selector: 'app-roles-assign-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './roles-assign-modal.component.html',
  styleUrls: ['./roles-assign-modal.component.css']
})
export class RolesAssignModalComponent implements OnInit {
  @Input() user!: UserRow;
  @Output() closed = new EventEmitter<boolean>();

  loading = true;                 // cargando catálogo + asignados
  saving = false;                 // guardando cambios
  roles: RoleRow[] = [];          // todos los roles
  selected = new Set<number>();   // ids de roles seleccionados
  q = '';                         // filtro local

  successMsg = '';                // mensaje verde
  errorMsg = '';                  // mensaje rojo

  constructor(private userSrv: UserManagementService) {}

  ngOnInit(): void {
    this.init();
  }

  /** Nombre bonito del usuario */
  displayName(u: UserRow): string {
    if (!u) return '—';
    if (u.display_name && u.display_name.trim()) return u.display_name.trim();
    const parts = [u.nombre, u.paterno, u.materno]
      .filter((x): x is string => !!x && !!x.trim());
    return parts.length ? parts.join(' ') : '—';
  }

  init(): void {
    this.loading = true;
    this.successMsg = '';
    this.errorMsg = '';

    // 1) catálogo de roles: GET /api/1/roles  (UserManagementService.listR())
    this.userSrv.listRoles().subscribe({
      next: (res) => {
        const all = res?.data ?? [];
        this.roles = all.map((r) => ({
          id_rol: Number(r.id_rol),
          nombre: String(r.nombre ?? `Rol #${r.id_rol}`)
        }));

        // 2) roles asignados al usuario:
        //    GET /api/managemt/users/{id_persona}/roles
        this.userSrv.assignedToUser(this.user.id_persona).subscribe({
          next: (res2) => {
            const ids = (res2?.data ?? []).map((x) => Number(x.id_rol));
            this.selected = new Set<number>(ids);
            this.loading = false;
          },
          error: () => {
            this.selected = new Set<number>();
            this.loading = false;
          }
        });
      },
      error: () => {
        this.roles = [];
        this.loading = false;
        this.errorMsg = 'No se pudo cargar el catálogo de roles.';
      }
    });
  }

  /** Lista de roles filtrados por q */
  get filtered(): RoleRow[] {
    const t = this.q.trim().toLowerCase();
    if (!t) return this.roles;
    return this.roles.filter(r => r.nombre.toLowerCase().includes(t));
  }

  /** Marcar / desmarcar rol */
  toggle(id_rol: number, checked: boolean): void {
    if (checked) {
      this.selected.add(id_rol);
    } else {
      this.selected.delete(id_rol);
    }
  }

  /** Guardar asignación */
  save(): void {
    if (!this.user) return;

    this.saving = true;
    this.successMsg = '';
    this.errorMsg = '';

    const ids = Array.from(this.selected.values());

    this.userSrv.saveForUser(this.user.id_persona, ids).subscribe({
      next: (res) => {
        this.saving = false;

        if (res?.success) {
          this.successMsg = res.message || 'Roles asignados correctamente.';

          // pequeño delay para que el usuario vea el check,
          // luego cerramos y el padre puede refrescar la lista
          setTimeout(() => {
            this.closed.emit(true);
          }, 1500);
        } else {
          this.errorMsg = res.message || 'No se pudo guardar la asignación de roles.';
        }
      },
      error: () => {
        this.saving = false;
        this.errorMsg = 'Ocurrió un error al guardar los roles.';
      }
    });
  }

  /** Cerrar sin guardar */
  close(): void {
    this.closed.emit(false);
  }
}
