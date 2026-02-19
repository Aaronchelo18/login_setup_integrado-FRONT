import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserManagementService } from '../../../core/services/management/user-management.service';
import { UserRow } from '../../../models/user/users.model';
import Swal from 'sweetalert2';

type RoleRow = { id_rol: number; nombre: string };

@Component({
  selector: 'app-roles-assign-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './roles-assign-modal.component.html',
  styleUrls: ['./roles-assign-modal.component.css']
})
export class RolesAssignModalComponent implements OnInit {
  @Input() user!: UserRow;
  @Output() closed = new EventEmitter<boolean>();

  saving = false;
  roles: RoleRow[] = [];
  selected = new Set<number>();

  constructor(private userSrv: UserManagementService) {}

  ngOnInit(): void {
    if (this.user) {
      this.loadData();
    }
  }

  // Nombre para el mensaje de éxito (Ej: DIEGO)
  displayFirstName(): string {
    return this.user?.nombre?.split(' ')[0].toUpperCase() || 'USUARIO';
  }

  // Nombre completo para el encabezado
  fullName(): string {
    const parts = [this.user?.nombre, this.user?.paterno, this.user?.materno].filter(x => !!x);
    return parts.join(' ');
  }

  loadData(): void {
    // Carga inmediata de roles y asignaciones
    this.userSrv.listRoles().subscribe(res => {
      this.roles = res.data || [];
    });

    this.userSrv.assignedToUser(this.user.id_persona).subscribe(res => {
      const ids = (res.data || []).map(r => Number(r.id_rol));
      this.selected = new Set(ids);
    });
  }

  toggle(id_rol: number): void {
    if (this.saving) return;
    if (this.selected.has(id_rol)) {
      this.selected.delete(id_rol);
    } else {
      this.selected.add(id_rol);
    }
  }

  async save(): Promise<void> {
    const { isConfirmed } = await Swal.fire({
      title: '¿Confirmar cambios?',
      text: `Se actualizarán los roles para ${this.fullName()}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#1b4079',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, guardar',
      cancelButtonText: 'Cancelar'
    });

    if (!isConfirmed) return;

    this.saving = true;
    const ids = Array.from(this.selected);

    this.userSrv.saveForUser(this.user.id_persona, ids).subscribe({
      next: () => {
        this.saving = false;
        Swal.fire({
          title: '¡Logrado!',
          text: `Roles asignados a ${this.displayFirstName()}`,
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
        this.closed.emit(true);
      },
      error: () => {
        this.saving = false;
        Swal.fire('Error', 'No se pudieron guardar los cambios', 'error');
      }
    });
  }

  close() { 
    if (!this.saving) this.closed.emit(false);
  }
}