// src/app/pages/setup/roles/roles.page.ts
import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { RolesHeroComponent } from './components/roles-hero/roles-hero.component';
import { RolesTableComponent } from './components/roles-table/roles-table.component';
import { RoleFormModalComponent } from './components/role-form-modal/role-form-modal.component';

import { RolesFacade } from './state/roles.facade';
import { ToastService } from '../../../core/ui/toast.service';
import Swal from 'sweetalert2';
import { CreateRoleDto, Role } from '../../../models/role/role.model';


// 👇 util opcional si la tienes (si no, usa la normalización inline más abajo)
// import { normalizeName } from './utils/role.utils';

type EstadoFiltro = 'todos' | 'activo' | 'inactivo';

@Component({
  selector: 'app-roles-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RolesHeroComponent, RolesTableComponent, RoleFormModalComponent],
  templateUrl: './roles.page.html',
  styleUrls: ['./roles.page.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class RolesPage implements OnInit {
  roles: Role[] = [];
  loading = false;

  filters: { estado: EstadoFiltro; busqueda?: string } = { estado: 'todos' };

  showCreate = false;
  savingCreate = false;
  serverErrorCreate = '';
  serverFieldErrorsCreate: Record<string, string> = {};
  editingRoleId: number | null = null;

  // 👇 referencia al modal para poder resetear el form
  @ViewChild(RoleFormModalComponent) modalRef!: RoleFormModalComponent;

  constructor(private facade: RolesFacade, private toast: ToastService) {}

  ngOnInit(): void {
    this.facade.list.subscribe(list => this.roles = list);
    this.facade.loading.subscribe(v => this.loading = v);
    this.facade.load();
  }

  // Hero
  onEstadoChange(estado: EstadoFiltro) { this.filters.estado = estado; this.facade.setEstado(estado); }
  onVisualizar() { this.facade.load(); }

  // Modal crear
  onNuevo() {
    this.serverErrorCreate = '';
    this.serverFieldErrorsCreate = {};
    this.editingRoleId = null;
    this.showCreate = true;

    // 🔄 limpia el formulario cuando se abre el modal
    setTimeout(() => this.modalRef?.reset({ nombre: '', estado: true }), 0);
  }

  onCloseModal() {
    if (!this.savingCreate) this.showCreate = false;
  }

  onSubmitCreate(v: { nombre: string; estado: boolean }) {
    if (this.savingCreate) return;

    this.serverErrorCreate = '';
    this.serverFieldErrorsCreate = {};

    const nombre = (v.nombre ?? '').trim();
    if (!nombre) {
      this.serverFieldErrorsCreate = { nombre: 'Requerido.' };
      this.serverErrorCreate = 'Corrige los campos marcados.';
      return;
    }

    // chequeo de duplicado en el FRONT (UX) — adicional al de la facade
    const nuevoNorm = this.normalizeName(nombre);
    const existe = this.roles.some(r => this.normalizeName(r.nombre) === nuevoNorm && r.id_rol !== this.editingRoleId);
    if (existe) {
      this.serverFieldErrorsCreate = { nombre: 'Rol ya existente' };
      this.serverErrorCreate = 'Rol ya existente';
      this.toast.show('Rol ya existente', 'error');
      return;
    }

    this.savingCreate = true;
    // Si estamos editando solo actualizamos el nombre
    if (this.editingRoleId != null) {
      this.facade.updateName(this.editingRoleId, nombre).subscribe({
        next: () => {
          this.savingCreate = false;
          this.showCreate = false;
          this.toast.show('Rol actualizado satisfactoriamente', 'success');
        },
        error: (err) => {
          this.savingCreate = false;
          this.serverErrorCreate = err?.error?.message || 'Error al actualizar el rol.';
          this.toast.show(this.serverErrorCreate, 'error');
        }
      });
      return;
    }

    const dto: CreateRoleDto = { nombre, estado: v.estado ? '1' : '0' };

    this.facade.create(dto).subscribe({
      next: () => {
        this.savingCreate = false;
        this.showCreate = false;
        this.toast.show('Rol creado satisfactoriamente', 'success');

        // Si prefieres refrescar desde backend:
        this.facade.load();
      },
      error: (err) => {
        this.savingCreate = false;

        if (err?.code === 'DUPLICATE') {
          this.serverFieldErrorsCreate = { nombre: 'Rol ya existente' };
          this.serverErrorCreate = 'Rol ya existente';
          this.toast.show('Rol ya existente', 'error');
          return;
        }

        if (err?.status === 422 && err?.error?.errors) {
          const errors = err.error.errors as Record<string, string[]>;
          this.serverFieldErrorsCreate = Object.fromEntries(
            Object.entries(errors).map(([k, v]) => [k, v?.[0] ?? 'Campo inválido'])
          );
          this.serverErrorCreate = err?.error?.message || 'Corrige los campos marcados.';
        } else {
          this.serverErrorCreate = err?.error?.message || 'Error al crear el rol.';
          this.toast.show(this.serverErrorCreate, 'error');
        }
      }
    });
  }

  // Helpers
  private normalizeName(s: string): string {
    return (s || '').trim().toLowerCase().replace(/\s+/g, ' ');
  }

  // Tabla (placeholders)
  onEdit(r: Role) {
    this.serverErrorCreate = '';
    this.serverFieldErrorsCreate = {};
    this.editingRoleId = r.id_rol;
    this.showCreate = true;
    setTimeout(() => this.modalRef?.reset({ nombre: r.nombre, estado: r.estado === '1' }), 0);
  }
  onToggle(r: Role) {
    const nuevoEstadoLabel = r.estado === '1' ? 'Inactivo' : 'Activo';
    Swal.fire({
      title: 'Confirmar cambio',
      text: `Cambiar estado de "${r.nombre}" a ${nuevoEstadoLabel}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, cambiar',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        this.facade.optimisticToggle(r).subscribe({
          next: () => this.toast.show('Estado actualizado', 'success'),
          error: (err) => this.toast.show(err?.error?.message || err?.message || 'No se pudo actualizar el estado', 'error')
        });
      }
    });
  }

  onRemove(r: Role) {
    Swal.fire({
      title: 'Eliminar rol',
      text: `¿Eliminar "${r.nombre}"? Esta acción no se puede revertir.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        this.facade.delete(r).subscribe({
          next: () => this.toast.show('Rol eliminado', 'success'),
          error: (err) => this.toast.show(err?.error?.message || err?.message || 'No se pudo eliminar', 'error')
        });
      }
    });
  }
}
