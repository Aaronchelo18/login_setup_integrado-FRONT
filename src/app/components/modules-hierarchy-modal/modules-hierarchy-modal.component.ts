import { 
  Component, 
  Input, 
  Output, 
  EventEmitter, 
  OnChanges, 
  SimpleChanges, 
  CUSTOM_ELEMENTS_SCHEMA 
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { finalize } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { ModuleHierarchyService, ModuleNode } from '../../core/services/module-hierarchy.service';
import { IconPickerComponent } from '../../icon-picker/icon-picker.component';

@Component({
  selector: 'app-modules-hierarchy-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, IconPickerComponent],
  templateUrl: './modules-hierarchy-modal.component.html',
  styleUrls: ['./modules-hierarchy-modal.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ModulesHierarchyModalComponent implements OnChanges {
  @Input() rootId!: number;
  @Input() titulo = 'Jerarquía de Módulos';

  @Output() closed = new EventEmitter<void>();
  @Output() saved  = new EventEmitter<void>();

  loading = false;
  error = '';
  tree: ModuleNode[] = [];

  // Propiedades para el control de edición (CORREGIDO)
  editingNode: ModuleNode | null = null;
  showIconPicker = false;
  editData = {
    nombre: '',
    url: '',
    imagen: 'lucide:box',
    active: true
  };

  constructor(private api: ModuleHierarchyService) {}

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
        error: e => { 
          console.error(e); 
          this.error = 'No se pudo sincronizar la jerarquía.'; 
        }
      });
  }

  // --- MÉTODOS DE EDICIÓN ---

  editNode(node: ModuleNode): void {
    this.editingNode = node;
    this.editData = {
      nombre: node.nombre,
      url: node.url || '',
      imagen: node.imagen || 'lucide:box',
      active: node.estado !== '0'
    };
  }

  cancelEdit(): void {
    this.editingNode = null;
    this.showIconPicker = false;
  }

  onIconSelected(icon: string): void {
    this.editData.imagen = icon;
    this.showIconPicker = false;
  }

  saveEdit(): void {
    if (!this.editData.nombre.trim() || !this.editingNode) return;

    // Casting de estado para cumplir con el tipo "0" | "1"
    const estadoValue: "0" | "1" = this.editData.active ? "1" : "0";

    const payload = {
      nombre: this.editData.nombre.trim(),
      url: this.editData.url.trim() || null,
      imagen: this.editData.imagen,
      estado: estadoValue
    };

    this.loading = true;
    this.api.patchNode(this.editingNode.id_modulo, payload)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => {
          this.toastOk('Módulo actualizado');
          this.editingNode = null;
          this.reload();
          this.saved.emit();
        },
        error: err => this.alertError(err, 'No se pudo actualizar'),
      });
  }

  remove(node: ModuleNode): void {
    Swal.fire({
      title: '¿Confirmar eliminación?',
      html: `Estás por eliminar <b>${node.nombre}</b>.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ef4444',
      reverseButtons: true
    }).then(r => {
      if (!r.isConfirmed) return;
      this.loading = true;
      this.api.deleteNode(node.id_modulo).pipe(finalize(() => (this.loading = false))).subscribe({
        next: () => { 
          this.toastOk('Módulo eliminado'); 
          this.reload(); 
          this.saved.emit(); 
        },
        error: err => this.alertError(err, 'No se pudo eliminar'),
      });
    });
  }

  cerrar(): void { 
    this.closed.emit(); 
  }

  trackById = (_: number, n: ModuleNode) => n.id_modulo;

  private toastOk(title: string): void {
    Swal.fire({ 
      toast: true, position: 'top-end', icon: 'success', title, 
      showConfirmButton: false, timer: 2000 
    });
  }

  private alertError(err: any, fallback: string): void {
    Swal.fire({ 
      icon: 'error', title: 'Operación fallida', 
      text: err?.error?.message || fallback
    });
  }
}