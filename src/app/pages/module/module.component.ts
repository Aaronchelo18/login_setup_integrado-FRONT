import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import Swal from 'sweetalert2';

import { ModuloService } from '../../core/services/modulo.service';
import { Modulo, ModuloOption } from '../../models/modulo.model';
import { PrivilegesTreePanelComponent } from '../../components/privileges-tree-panel/privileges-tree-panel.component';
import { ModuleModuloFormDialogComponent } from '../../components/modals/module-modulo-form-dialog/module-modulo-form-dialog.component';
import { ModulesHierarchyModalComponent } from '../../components/modules-hierarchy-modal/modules-hierarchy-modal.component';
import { LoaderService } from '../../shared/loading/loader.service';

@Component({
  selector: 'app-module',
  standalone: true,
  imports: [
    CommonModule, RouterModule, HttpClientModule,
    PrivilegesTreePanelComponent, ModuleModuloFormDialogComponent, ModulesHierarchyModalComponent,
  ],
  templateUrl: './module.component.html',
  styleUrls: ['./module.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ModuleComponent implements OnInit {
  error = '';
  cards: Modulo[] = [];
  parentId: number | null = null;
  selectedMod: Modulo | null = null;
  
  showPriv = false;
  openCreate = false;
  openEdit = false;
  openHier = false;
  
  parentOptions: ModuloOption[] = []; 
  loadingParents = false;
  creating = false;
  editing = false;

  constructor(
    private api: ModuloService,
    private route: ActivatedRoute,
    private loader: LoaderService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      const qParent = params.get('parent');
      this.parentId = qParent ? Number(qParent) : null;
      this.load();
    });
  }

  load(): void {
    this.loader.setLabel('Cargando módulos…');
    this.error = '';
    this.api.getModulosAdmin().subscribe({
      next: (data) => {
        this.cards = data;
        if (this.cards.length === 0) this.error = 'No hay módulos raíz configurados.';
      },
      error: () => this.error = 'Error de conexión con el servidor.'
    });
  }

  onCreateSubmit(p: any) {
    this.creating = true;
    const payload = { ...p, id_parent: p.id_parent || this.parentId || 0 };
    
    this.api.create(payload).pipe(finalize(() => (this.creating = false))).subscribe({
      next: () => {
        this.closeCreateModal();
        this.load();
        Swal.fire('Creado', 'El módulo se registró con éxito', 'success');
      },
      error: (err: any) => Swal.fire('Error', err.error?.message || 'No se pudo crear', 'error')
    });
  }

  onEditSubmit(p: any) {
    if (!this.selectedMod) return;
    this.editing = true;

    const payload = {
      nombre: p.nombre,
      url: p.url,
      imagen: p.imagen,
      estado: p.estado,
      id_parent: p.id_parent || 0,
      nivel: p.nivel || 0
    };

    this.api.update(this.selectedMod.id_modulo, payload)
      .pipe(finalize(() => (this.editing = false)))
      .subscribe({
        next: () => {
          this.closeEditModal();
          this.load();
          Swal.fire('Actualizado', 'Cambios guardados correctamente', 'success');
        },
        error: (err: any) => {
          console.error("Error detalle:", err);
          Swal.fire('Error', err.error?.message || 'Datos inválidos', 'error');
        }
      });
  }

  onDelete(m: Modulo) {
    Swal.fire({
      title: '¿Eliminar módulo?',
      text: `Se eliminará: ${m.nombre}.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      confirmButtonColor: '#d33'
    }).then((res) => {
      if (res.isConfirmed) {
        this.api.remove(m.id_modulo).subscribe({
          next: () => {
            this.load();
            Swal.fire('Eliminado', 'Módulo borrado', 'success');
          },
          error: (err: any) => Swal.fire('Error', err.error?.message || 'No se puede eliminar', 'error')
        });
      }
    });
  }

  // Helpers de UI
  iconType(icon?: string | null) { 
    return icon?.includes(':') ? 'iconify' : icon?.match(/\.(png|jpg|jpeg|svg|webp)$/i) ? 'img' : 'none'; 
  }
  iconUrl(icon?: string | null) { 
    return /^https?:\/\//i.test(icon!) ? icon! : `assets/img/${icon}`; 
  }
  firstLetter = (n?: string | null) => (n || 'M').trim().charAt(0).toUpperCase();
  trackById = (_: number, m: Modulo) => m.id_modulo;

  goBack(): void {
    if (this.parentId) this.router.navigate(['/setup/modulos']); 
    else this.router.navigate(['/setup']);
  }

  fetchParents() {
    if (this.loadingParents) return;
    this.loadingParents = true;
    this.api.getOptions(true).pipe(finalize(() => this.loadingParents = false)).subscribe({
      next: (opts) => this.parentOptions = opts ?? [],
      error: () => this.parentOptions = []
    });
  }

  // Control de Modales
  openCreateModal() { this.openCreate = true; this.toggleBodyScroll(true); this.fetchParents(); }
  closeCreateModal() { this.openCreate = false; this.toggleBodyScroll(false); }
  
  openEditModal(m: Modulo) { this.selectedMod = m; this.openEdit = true; this.toggleBodyScroll(true); this.fetchParents(); }
  closeEditModal() { this.openEdit = false; this.toggleBodyScroll(false); }
  
  openPrivileges(m: Modulo) { this.selectedMod = m; this.showPriv = true; this.toggleBodyScroll(true); }
  closePriv() { this.showPriv = false; this.toggleBodyScroll(false); }
  
  // ESTE ES EL MÉTODO QUE PEDISTE (Jerarquía)
  openHierarchy(m: Modulo) { 
    this.selectedMod = m; 
    this.openHier = true; 
    this.toggleBodyScroll(true); 
  }
  closeHierarchy() { this.openHier = false; this.toggleBodyScroll(false); }

  refreshAfterSave() { this.closePriv(); this.load(); }
  onHierarchySaved() { this.load(); }
  
  private toggleBodyScroll(lock: boolean) { document.body.style.overflow = lock ? 'hidden' : ''; }
}