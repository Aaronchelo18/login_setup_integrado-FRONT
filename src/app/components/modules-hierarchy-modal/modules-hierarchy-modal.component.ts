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
import { finalize } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { ModuleHierarchyService, ModuleNode } from '../../core/services/module-hierarchy.service';

@Component({
  selector: 'app-modules-hierarchy-modal',
  standalone: true,
  imports: [CommonModule],
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

  private getFormHtml(node?: Partial<ModuleNode>): string {
    return `
      <div class="swal-custom-form" style="text-align:left; font-family: 'Inter', sans-serif;">
        <div style="margin-bottom: 12px;">
          <label style="display:block; font-size:12px; font-weight:600; color:#64748b; margin-bottom:5px;">Nombre del Módulo</label>
          <input id="sw-nombre" class="swal2-input" style="width:100%; margin:0; font-size:14px; height:38px;" value="${node?.nombre || ''}" placeholder="Ej. Reportes de Ventas">
        </div>
        <div style="margin-bottom: 12px;">
          <label style="display:block; font-size:12px; font-weight:600; color:#64748b; margin-bottom:5px;">Ruta / URL</label>
          <input id="sw-url" class="swal2-input" style="width:100%; margin:0; font-size:14px; height:38px;" value="${node?.url || ''}" placeholder="/ventas/reportes">
        </div>
        <div style="margin-bottom: 12px;">
          <label style="display:block; font-size:12px; font-weight:600; color:#64748b; margin-bottom:5px;">Icono (Iconify)</label>
          <input id="sw-img" class="swal2-input" style="width:100%; margin:0; font-size:14px; height:38px;" value="${node?.imagen || 'lucide:box'}" placeholder="lucide:box">
        </div>
        <div style="display:flex; align-items:center; gap:10px; padding-top:8px;">
          <label class="swal-switch" style="position:relative; display:inline-block; width:34px; height:20px;">
            <input type="checkbox" id="sw-estado" ${node?.estado !== '0' ? 'checked' : ''} style="opacity:0; width:0; height:0;">
            <span class="slider" style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:#ccc; transition:.4s; border-radius:34px;"></span>
          </label>
          <span style="font-size:13px; font-weight:500; color:#1e293b;">Módulo Activo</span>
        </div>
        <style>
          .swal2-input:focus { border-color: #2563eb !important; box-shadow: 0 0 0 2px rgba(37,99,235,0.1) !important; }
          #sw-estado:checked + .slider { background-color: #2563eb; }
          .slider:before { position:absolute; content:''; height:14px; width:14px; left:3px; bottom:3px; background-color:white; transition:.4s; border-radius:50%; }
          #sw-estado:checked + .slider:before { transform: translateX(14px); }
        </style>
      </div>
    `;
  }

  addChild(parent?: ModuleNode): void {
    const id_parent = parent ? parent.id_modulo : this.rootId;
    Swal.fire({
      title: 'Nuevo Sub-módulo',
      html: this.getFormHtml(),
      showCancelButton: true,
      confirmButtonText: 'Crear Módulo',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#2563eb',
      reverseButtons: true,
      preConfirm: () => {
        const nombre = (document.getElementById('sw-nombre') as HTMLInputElement).value.trim();
        if (!nombre) return Swal.showValidationMessage('El nombre es obligatorio');
        return {
          id_parent,
          nombre,
          url: (document.getElementById('sw-url') as HTMLInputElement).value.trim() || null,
          imagen: (document.getElementById('sw-img') as HTMLInputElement).value.trim() || 'lucide:box',
          estado: (document.getElementById('sw-estado') as HTMLInputElement).checked ? '1' : '0'
        };
      }
    }).then(res => {
      if (!res.isConfirmed) return;
      this.loading = true;
      this.api.createNode(res.value).pipe(finalize(() => this.loading = false)).subscribe({
        next: () => { this.toastOk('Módulo registrado'); this.reload(); this.saved.emit(); },
        error: err => this.alertError(err, 'No se pudo crear el módulo'),
      });
    });
  }

  editNode(node: ModuleNode): void {
    Swal.fire({
      title: 'Editar Módulo',
      html: this.getFormHtml(node),
      showCancelButton: true,
      confirmButtonText: 'Actualizar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#2563eb',
      reverseButtons: true,
      preConfirm: () => {
        const nombre = (document.getElementById('sw-nombre') as HTMLInputElement).value.trim();
        if (!nombre) return Swal.showValidationMessage('El nombre es obligatorio');
        return {
          nombre,
          url: (document.getElementById('sw-url') as HTMLInputElement).value.trim() || null,
          imagen: (document.getElementById('sw-img') as HTMLInputElement).value.trim() || 'lucide:box',
          estado: (document.getElementById('sw-estado') as HTMLInputElement).checked ? '1' : '0'
        };
      }
    }).then(res => {
      if (!res.isConfirmed) return;
      this.loading = true;
      this.api.patchNode(node.id_modulo, res.value).pipe(finalize(() => this.loading = false)).subscribe({
        next: () => { this.toastOk('Cambios guardados'); this.reload(); this.saved.emit(); },
        error: err => this.alertError(err, 'No se pudo actualizar'),
      });
    });
  }

  remove(node: ModuleNode): void {
    Swal.fire({
      title: '¿Confirmar eliminación?',
      html: `Estás por eliminar <b>${node.nombre}</b>.<br><small style="color:#ef4444">Esta acción afectará a todos los sub-módulos dependientes.</small>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Mantener',
      confirmButtonColor: '#ef4444',
      reverseButtons: true
    }).then(r => {
      if (!r.isConfirmed) return;
      this.loading = true;
      this.api.deleteNode(node.id_modulo).pipe(finalize(() => this.loading = false)).subscribe({
        next: () => { this.toastOk('Módulo eliminado'); this.reload(); this.saved.emit(); },
        error: err => this.alertError(err, 'No se pudo eliminar'),
      });
    });
  }

  cerrar(): void { this.closed.emit(); }
  trackById = (_: number, n: ModuleNode) => n.id_modulo;

  private toastOk(title: string): void {
    Swal.fire({ 
      toast: true, position: 'top-end', icon: 'success', title, 
      showConfirmButton: false, timer: 2000, background: '#fff', color: '#1e293b'
    });
  }

  private alertError(err: any, fallback: string): void {
    Swal.fire({ 
      icon: 'error', title: 'Operación fallida', 
      text: err?.error?.message || fallback, confirmButtonColor: '#2563eb'
    });
  }
}