import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { ModuleHierarchyService, ModuleNode } from '../../core/services/module-hierarchy.service';

@Component({
  selector: 'app-modules-hierarchy-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modules-hierarchy-modal.component.html',
  styleUrls: ['./modules-hierarchy-modal.component.scss'],
})
export class ModulesHierarchyModalComponent implements OnChanges {
  /** Id del módulo raíz desde el que abrirás la jerarquía */
  @Input() rootId!: number;
  @Input() titulo = 'Jerarquía de Módulos';

  @Output() closed = new EventEmitter<void>();
  @Output() saved  = new EventEmitter<void>();

  loading = false;
  error = '';
  tree: ModuleNode[] = [];

  constructor(private api: ModuleHierarchyService) {}

  // Cargar solo cuando rootId esté definido (>0)
  ngOnChanges(changes: SimpleChanges): void {
    if ('rootId' in changes) {
      const v = Number(this.rootId);
      if (Number.isFinite(v) && v > 0) {
        this.reload();
      }
    }
  }

  private reload(): void {
    this.loading = true;
    this.error = '';
    this.api.getTree({ root_id: this.rootId, include_inactives: true })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: rows => this.tree = rows ?? [],
        error: e => { console.error(e); this.error = 'No se pudo cargar la jerarquía.'; }
      });
  }

  // ---------- acciones ----------
  addChild(parent?: ModuleNode): void {
    const id_parent = parent ? parent.id_modulo : this.rootId;
    Swal.fire({
      title: 'Nuevo módulo',
      input: 'text',
      inputLabel: 'Nombre del módulo',
      inputPlaceholder: 'Ej. Cotizaciones',
      showCancelButton: true,
      confirmButtonText: 'Crear',
      cancelButtonText: 'Cancelar',
      inputValidator: v => (!v?.trim() ? 'Ingresa un nombre' : null),
    }).then(res => {
      if (!res.isConfirmed) return;
      const nombre = String(res.value).trim();

      this.loading = true;
      this.api.createNode({
        parent_id: id_parent,
        nombre,
        url: null,
        imagen: 'default.png',
        estado: '1',
      })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => { this.toastOk('Nodo creado'); this.reload(); this.saved.emit(); },
        error: err => this.alertError(err, 'No se pudo crear el nodo'),
      });
    });
  }

  rename(node: ModuleNode): void {
    Swal.fire({
      title: 'Renombrar módulo',
      input: 'text',
      inputValue: node.nombre,
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      inputValidator: v => (!v?.trim() ? 'Ingresa un nombre' : null),
    }).then(res => {
      if (!res.isConfirmed) return;
      const nombre = String(res.value).trim();
      if (nombre === node.nombre) return;

      this.loading = true;
      this.api.patchNode(node.id_modulo, { nombre })
        .pipe(finalize(() => (this.loading = false)))
        .subscribe({
          next: () => { this.toastOk('Nombre actualizado'); this.reload(); this.saved.emit(); },
          error: err => this.alertError(err, 'No se pudo actualizar'),
        });
    });
  }

  remove(node: ModuleNode): void {
    Swal.fire({
      title: `Eliminar "${node.nombre}"`,
      text: 'Se eliminará el nodo. Verifica relaciones antes de continuar.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      focusCancel: true,
    }).then(r => {
      if (!r.isConfirmed) return;

      this.loading = true;
      this.api.deleteNode(node.id_modulo)
        .pipe(finalize(() => (this.loading = false)))
        .subscribe({
          next: () => { this.toastOk('Nodo eliminado'); this.reload(); this.saved.emit(); },
          error: err => this.alertError(err, 'No se pudo eliminar'),
        });
    });
  }

  cerrar(): void { this.closed.emit(); }

  // ---------- ui utils ----------
  trackById = (_: number, n: ModuleNode) => n.id_modulo;

  private toastOk(title: string): void {
    Swal.fire({ toast: true, position: 'top-end', icon: 'success', title,
      showConfirmButton: false, timer: 1300, timerProgressBar: true });
  }
  private alertError(err: any, fallback: string): void {
    const msg = err?.error?.message || fallback;
    Swal.fire({ icon: 'error', title: 'Error', text: msg });
  }
}
