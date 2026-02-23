import { 
  Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, CUSTOM_ELEMENTS_SCHEMA, OnInit, OnDestroy 
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { finalize, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
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
export class ModulesHierarchyModalComponent implements OnInit, OnChanges, OnDestroy {
  @Input() rootId!: number;
  @Input() titulo = 'Jerarquía de Módulos';

  @Output() closed = new EventEmitter<void>();
  @Output() saved  = new EventEmitter<void>();

  loading = false;
  isSaving = false;
  error = '';
  tree: ModuleNode[] = [];
  private destroy$ = new Subject<void>();

  editingNode: ModuleNode | null = null;
  showIconPicker = false;
  editData = {
    nombre: '',
    url: '',
    imagen: 'lucide:box',
    active: true
  };

  private Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 1500,
    timerProgressBar: true
  });

  constructor(private api: ModuleHierarchyService) {}

  ngOnInit(): void {
    // SUSCRIPCIÓN AL FLUJO DE DATOS (INSTANTÁNEO)
    this.api.tree$
      .pipe(takeUntil(this.destroy$))
      .subscribe(nodes => {
        this.tree = nodes;
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ('rootId' in changes && this.rootId) {
      this.reload();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private reload(): void {
    // Solo mostramos "loading" si no hay datos previos
    if (this.tree.length === 0) this.loading = true;
    
    this.api.getTree({ root_id: this.rootId, include_inactives: true })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        error: () => this.error = 'Error al sincronizar datos.'
      });
  }

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
    if (this.isSaving) return;
    this.editingNode = null;
    this.showIconPicker = false;
  }

  onIconSelected(icon: string): void {
    this.editData.imagen = icon;
    this.showIconPicker = false;
  }

  saveEdit(): void {
    if (!this.editData.nombre.trim() || !this.editingNode || this.isSaving) return;

    this.isSaving = true;
    const estadoValue: "0" | "1" = this.editData.active ? "1" : "0";

    const payload = {
      nombre: this.editData.nombre.trim(),
      url: this.editData.url.trim() || null,
      imagen: this.editData.imagen,
      estado: estadoValue
    };

    this.api.patchNode(this.editingNode.id_modulo, payload)
      .pipe(finalize(() => (this.isSaving = false)))
      .subscribe({
        next: () => {
          this.Toast.fire({ icon: 'success', title: 'Módulo actualizado' });
          this.editingNode = null;
          this.saved.emit();
          // El reload() se dispara automáticamente por la lógica del servicio
        },
        error: err => {
          Swal.fire('Error', err?.error?.message || 'No se pudo actualizar', 'error');
        },
      });
  }

  remove(node: ModuleNode): void {
    Swal.fire({
      title: '¿Eliminar módulo?',
      text: `Se borrará "${node.nombre}" y su descendencia.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ef4444',
      reverseButtons: true,
      focusCancel: true
    }).then(r => {
      if (!r.isConfirmed) return;
      
      this.api.deleteNode(node.id_modulo)
        .subscribe({
          next: () => { 
            this.Toast.fire({ icon: 'success', title: 'Eliminado correctamente' });
            this.saved.emit(); 
          },
          error: err => {
            Swal.fire('Error', err?.error?.message || 'Error al eliminar', 'error');
          }
        });
    });
  }

  cerrar(): void { 
    if (!this.isSaving) this.closed.emit(); 
  }

  trackById = (_: number, n: ModuleNode) => n.id_modulo;
}