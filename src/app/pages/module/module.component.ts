import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router'; // Importar Router
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
  error = '';
  cards: Modulo[] = [];
  private parentId?: number;
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
    private router: Router // Inyectado
  ) {}

  ngOnInit(): void {
    const qParent = this.route.snapshot.queryParamMap.get('parent');
    this.parentId = qParent != null ? Number(qParent) : undefined;
    this.load();
  }

  // Navegación al Shell / Setup
  goBack(): void {
    this.router.navigate(['/setup']);
  }

  load(): void {
    this.loader.setLabel('Cargando módulos…');
    this.api.getAll().subscribe({
      next: (all: Modulo[]) => {
        this.cards =
          this.parentId != null
            ? all.filter((m) => Number(m.id_parent) === this.parentId)
            : all.filter((m) => Number(m.nivel) === 0);
      },
      error: () => (this.error = 'Error de conexión.'),
    });
  }

  fetchParents() {
    if (this.loadingParents || this.parentOptions.length > 0) return;
    this.loadingParents = true;
    this.api.getOptions(true)
      .pipe(finalize(() => this.loadingParents = false))
      .subscribe({
        next: (opts) => { this.parentOptions = opts ?? []; },
        error: () => { this.parentOptions = []; }
      });
  }

  firstLetter = (n?: string | null) => (n || 'M').trim().charAt(0).toUpperCase();

  openPrivileges(m: Modulo) {
    this.selectedMod = m;
    this.showPriv = true;
    this.toggleBodyScroll(true);
  }

  closePriv() {
    this.showPriv = false;
    this.toggleBodyScroll(false);
  }

  openCreateModal() {
    this.openCreate = true;
    this.toggleBodyScroll(true);
    this.fetchParents(); 
  }

  closeCreateModal() {
    this.openCreate = false;
    this.toggleBodyScroll(false);
  }

  openEditModal(m: Modulo) {
    this.selectedMod = m;
    this.openEdit = true;
    this.toggleBodyScroll(true);
    this.fetchParents();
  }

  closeEditModal() {
    this.openEdit = false;
    this.toggleBodyScroll(false);
  }

  openHierarchy(m: Modulo) {
    this.selectedMod = m;
    this.openHier = true;
    this.toggleBodyScroll(true);
  }

  closeHierarchy() {
    this.openHier = false;
    this.toggleBodyScroll(false);
  }

  onDelete(m: Modulo) {
    Swal.fire({
      title: '¿Eliminar?',
      text: `Módulo: ${m.nombre}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
    }).then((res) => {
      if (res.isConfirmed) {
        this.api.remove(m.id_modulo).subscribe(() => {
          this.load();
          Swal.fire('Eliminado', '', 'success');
        });
      }
    });
  }

  onCreateSubmit(p: any) {
    this.creating = true;
    this.api.create(p).pipe(finalize(() => (this.creating = false))).subscribe(() => {
        this.closeCreateModal();
        this.load();
      });
  }

  onEditSubmit(p: any) {
    this.editing = true;
    this.api.update(this.selectedMod!.id_modulo, p).pipe(finalize(() => (this.editing = false))).subscribe(() => {
        this.closeEditModal();
        this.load();
      });
  }

  refreshAfterSave() {
    this.closePriv();
    this.load();
  }

  onHierarchySaved() {
    this.load();
  }

  private toggleBodyScroll(lock: boolean) {
    document.body.style.overflow = lock ? 'hidden' : '';
  }

  trackById = (_: number, m: Modulo) => m.id_modulo;
  
  iconType(icon?: string | null) {
    return icon?.match(/\.(png|jpg|jpeg|svg|webp)$/i) ? 'img' : 'iconify';
  }
  
  iconUrl(icon?: string | null) {
    return /^https?:\/\//i.test(icon!) ? icon! : `assets/img/${icon}`;
  }
}