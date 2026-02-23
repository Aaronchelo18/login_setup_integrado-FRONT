import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
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

@Component({
  selector: 'app-module',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    HttpClientModule,
    PrivilegesTreePanelComponent, 
    ModuleModuloFormDialogComponent, 
    ModulesHierarchyModalComponent,
  ],
  templateUrl: './module.component.html',
  styleUrls: ['./module.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ModuleComponent implements OnInit {
  // Estado de la UI
  error = ''; 
  cards: Modulo[] = [];
  parentId: number | null = null;
  selectedMod: Modulo | null = null;
  
  // Modales
  showPriv = false;
  openCreate = false;
  openEdit = false;
  openHier = false;
  
  // Estados de carga
  parentOptions: ModuloOption[] = []; 
  loadingParents = false;
  creating = false;
  editing = false;

  private api = inject(ModuloService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // Configuración de Notificaciones Rápidas
  private Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 1200,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer)
      toast.addEventListener('mouseleave', Swal.resumeTimer)
    }
  });

  ngOnInit(): void {
    // Suscripción al BehaviorSubject para carga instantánea desde caché
    this.api.modules$.subscribe({
      next: (data) => {
        this.cards = data;
        if (data.length > 0) this.error = '';
      }
    });

    this.route.queryParamMap.subscribe(params => {
      const qParent = params.get('parent');
      this.parentId = qParent ? Number(qParent) : null;
      this.load();
    });
  }

  load(): void {
    this.api.getModulosAdmin().subscribe({
      error: (err: any) => {
        this.error = 'Error de conexión con el servidor.';
        console.error(err);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/app/application-management/dashboard']);
  }

  onCreateSubmit(p: any) {
    const nombre = p?.nombre ?? p?.name ?? '';
    if (!nombre) {
      Swal.fire('Atención', 'El nombre es obligatorio', 'warning');
      return;
    }

    this.creating = true;
    const payload = {
      nombre: nombre,
      id_parent: Number(p.id_parent ?? this.parentId ?? 0)
    };

    this.api.create(payload)
      .pipe(finalize(() => (this.creating = false)))
      .subscribe({
        next: () => {
          this.closeCreateModal();
          this.Toast.fire({ icon: 'success', title: 'Módulo creado con éxito' });
        },
        error: (err: any) => {
          Swal.fire('Error', err?.error?.message || 'No se pudo crear', 'error');
        }
      });
  }

  onEditSubmit(p: any) {
    if (!this.selectedMod) return;
    this.editing = true;

    // Actualización Optimista: Reflejar cambios inmediatamente en la UI
    const originalCards = [...this.cards];
    const idx = this.cards.findIndex(m => m.id_modulo === this.selectedMod!.id_modulo);
    if (idx !== -1) {
      this.cards[idx] = { ...this.cards[idx], ...p };
    }

    this.api.update(this.selectedMod.id_modulo, p)
      .pipe(finalize(() => (this.editing = false)))
      .subscribe({
        next: () => {
          this.closeEditModal();
          this.Toast.fire({ icon: 'success', title: 'Actualizado correctamente' });
        },
        error: (err: any) => {
          this.cards = originalCards; // Revertir si falla el servidor
          Swal.fire('Error', err.error?.message || 'Error al actualizar', 'error');
        }
      });
  }

  onDelete(m: Modulo) {
    Swal.fire({
      title: '¿Eliminar módulo?',
      text: `Se borrará "${m.nombre}". Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    }).then((res) => {
      if (res.isConfirmed) {
        // El servicio ya hace el filtrado optimista en modules$.next()
        this.api.remove(m.id_modulo).subscribe({
          next: () => this.Toast.fire({ icon: 'success', title: 'Módulo eliminado' }),
          error: (err: any) => {
            this.load(); // Recargar para recuperar el card si falló el borrado
            Swal.fire('Error', err.error?.message || 'No se pudo eliminar', 'error');
          }
        });
      }
    });
  }

  fetchParents() {
    // Si ya hay opciones, no cargamos de nuevo para ganar velocidad
    if (this.parentOptions.length > 0 || this.loadingParents) return;
    
    this.loadingParents = true;
    this.api.getOptions(true)
      .pipe(finalize(() => this.loadingParents = false))
      .subscribe({
        next: (opts) => this.parentOptions = opts ?? [],
        error: () => this.parentOptions = []
      });
  }

  // Helpers de Iconos y UI
  iconType(icon?: string | null) { 
    if (icon?.includes(':')) return 'iconify';
    if (icon?.match(/\.(png|jpg|jpeg|svg|webp)$/i)) return 'img';
    return 'none';
  }
  
  iconUrl(icon?: string | null) { 
    return /^https?:\/\//i.test(icon!) ? icon! : `assets/img/${icon}`; 
  }

  firstLetter = (n?: string | null) => (n || 'M').trim().charAt(0).toUpperCase();
  trackById = (_: number, m: Modulo) => m.id_modulo;

  // Gestión de Modales con bloqueo de scroll
  openCreateModal() { 
    this.openCreate = true; 
    this.toggleBodyScroll(true); 
    this.fetchParents(); 
  }
  closeCreateModal() { this.openCreate = false; this.toggleBodyScroll(false); }
  
  openEditModal(m: Modulo) { 
    this.selectedMod = { ...m }; 
    this.openEdit = true; 
    this.toggleBodyScroll(true); 
    this.fetchParents(); 
  }
  closeEditModal() { this.openEdit = false; this.toggleBodyScroll(false); }
  
  openPrivileges(m: Modulo) { 
    this.selectedMod = m; 
    this.showPriv = true; 
    this.toggleBodyScroll(true); 
  }
  closePriv() { this.showPriv = false; this.toggleBodyScroll(false); }
  
  openHierarchy(m: Modulo) { 
    this.selectedMod = m; 
    this.openHier = true; 
    this.toggleBodyScroll(true); 
  }
  closeHierarchy() { this.openHier = false; this.toggleBodyScroll(false); }
  
  refreshAfterSave() { this.closePriv(); this.load(); }
  onHierarchySaved() { this.load(); }
  
  private toggleBodyScroll(lock: boolean) { 
    document.body.style.overflow = lock ? 'hidden' : ''; 
  }
}