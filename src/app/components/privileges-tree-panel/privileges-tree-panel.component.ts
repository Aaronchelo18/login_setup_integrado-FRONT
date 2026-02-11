import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnChanges,
  SimpleChanges,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';

import {
  ModuleHierarchyService,
  ModuleNode,
} from '../../core/services/module-hierarchy.service';
import {
  PrivilegesService,
  TreeMatrixRow,
  PrivFlag,
} from '../../core/services/privileges.service';
import { LoaderService } from '../../shared/loading/loader.service';

type NodeView = ModuleNode & { flags?: PrivFlag };

@Component({
  selector: 'app-privileges-tree-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './privileges-tree-panel.component.html',
  styleUrls: ['./privileges-tree-panel.component.scss'],
})
export class PrivilegesTreePanelComponent implements OnChanges, OnDestroy {
  @Input() parentId!: number;
  @Input() titulo = 'Privilegios por jerarquía';
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  loading = false;
  saving = false;
  error = '';

  tree: NodeView[] = [];
  flagsById = new Map<number, PrivFlag>();

  constructor(
    private modApi: ModuleHierarchyService,
    private privApi: PrivilegesService,
    private loader: LoaderService,
  ) {}

  ngOnChanges(ch: SimpleChanges): void {
    if ('parentId' in ch) {
      const id = Number(this.parentId);
      if (Number.isFinite(id) && id > 0) this.reload();
    }
  }

  ngOnDestroy(): void {
    // Cierre de seguridad si el modal se cierra en medio de la carga/guardado
    this.loader.requestEnded();
  }

  // ================== CARGA ==================
  private reload(): void {
    this.loading = true;
    this.error = '';
    this.flagsById.clear();
    this.tree = [];

    this.loader.setLabel('Cargando privilegios…');
    this.loader.requestStarted('Cargando privilegios…');

    // Traemos árbol y matriz en paralelo
    forkJoin({
      tree: this.modApi.getTree({
        root_id: this.parentId,
        include_inactives: true,
      }),
      matrix: this.privApi.getTreeMatrix(this.parentId),
    })
      .pipe(
        finalize(() => {
          this.loading = false;
          this.loader.requestEnded();
        }),
      )
      .subscribe({
        next: ({ tree, matrix }) => {
          this.tree = (tree ?? []) as NodeView[];
          for (const m of matrix ?? []) {
            this.flagsById.set(m.id_modulo, { ...m.flags });
          }
          this.applyFlagsToTree(this.tree);
        },
        error: (e: any) => {
          console.error(e);
          this.error = 'No se pudo cargar los privilegios.';
        },
      });
  }

  private applyFlagsToTree(list: NodeView[]): void {
    for (const n of list) {
      const f =
        this.flagsById.get(n.id_modulo) ?? {
          crear: false,
          listar: false,
          editar: false,
          eliminar: false,
        };
      n.flags = f;
      if (n.children?.length) this.applyFlagsToTree(n.children as NodeView[]);
    }
  }

  trackById = (_: number, n: NodeView) => n.id_modulo;

  // ================== CIERRE ==================
  requestClose(): void {
    if (!this.hasUnsavedChanges()) {
      this.closed.emit();
      return;
    }
    Swal.fire({
      title: 'Tienes cambios sin guardar',
      text: '¿Deseas salir sin guardar?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Salir sin guardar',
      cancelButtonText: 'Volver',
    }).then((r) => {
      if (r.isConfirmed) this.closed.emit();
    });
  }

  hasUnsavedChanges(): boolean {
    const current = JSON.stringify([...this.flagsById.entries()].sort());
    const base: [number, PrivFlag][] = [];
    this.walk(this.tree, (n) => base.push([n.id_modulo, n.flags!]));
    const snapshot = JSON.stringify(base.sort());
    return current !== snapshot;
  }

  private walk(list: NodeView[], fn: (n: NodeView) => void) {
    for (const n of list) {
      fn(n);
      if (n.children?.length) this.walk(n.children as NodeView[], fn);
    }
  }

  // ================== GUARDAR MATRIZ ==================
  save(): void {
    if (!this.parentId) return;
    this.saving = true;

    this.loader.setLabel('Guardando privilegios…');
    this.loader.requestStarted('Guardando privilegios…');

    const items: TreeMatrixRow[] = [];
    this.walk(this.tree, (n) => {
      const f =
        this.flagsById.get(n.id_modulo) ?? {
          crear: false,
          listar: false,
          editar: false,
          eliminar: false,
        };
      items.push({
        id_modulo: n.id_modulo,
        modulo: n.nombre,
        flags: { ...f },
      });
    });

    this.privApi
      .assignTreeMatrix(this.parentId, items)
      .pipe(
        finalize(() => {
          this.saving = false;
          this.loader.requestEnded();
        }),
      )
      .subscribe({
        next: () => {
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Cambios guardados',
            timer: 1400,
            showConfirmButton: false,
          });
          this.saved.emit();
          this.closed.emit();
        },
        error: (e: any) => {
          console.error(e);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo guardar la matriz.',
          });
        },
      });
  }

  // ================== TOGGLE CHECKBOX ==================
  toggle(id: number, key: keyof PrivFlag, val: boolean) {
    const prev =
      this.flagsById.get(id) ?? {
        crear: false,
        listar: false,
        editar: false,
        eliminar: false,
      };
    this.flagsById.set(id, { ...prev, [key]: val });
  }

  // ================== NUEVO: crear catálogo CRUD para un módulo ==================
  createCrudForNode(node: NodeView): void {
    if (!node?.id_modulo) return;

    Swal.fire({
      title: 'Nuevo grupo de privilegios',
      text: `Se crearán privilegios CRUD para "${node.nombre}".`,
      input: 'text',
      inputLabel: 'Nombre del grupo de privilegios',
      inputValue: node.nombre,
      showCancelButton: true,
      confirmButtonText: 'Crear',
      cancelButtonText: 'Cancelar',
      inputValidator: (value: string) => {
        if (!value || !value.trim()) return 'Ingresa un nombre válido';
        return null;
      },
    }).then((res) => {
      if (!res.isConfirmed) return;

      const nombre = (res.value as string).trim();

      // 👇 AQUÍ tipamos explícitamente estado como '0' | '1'
      const payload: { nombre: string; acciones: string[]; estado: '0' | '1' } =
        {
          nombre,
          acciones: ['Crear', 'Listar', 'Editar', 'Eliminar'],
          estado: '1',
        };

      this.saving = true;
      this.loader.setLabel('Creando privilegios…');
      this.loader.requestStarted('Creando privilegios…');

      this.privApi
        .createCatalog(node.id_modulo, payload)
        .pipe(
          finalize(() => {
            this.saving = false;
            this.loader.requestEnded();
          }),
        )
        .subscribe({
          next: () => {
            Swal.fire({
              toast: true,
              position: 'top-end',
              icon: 'success',
              title: 'Privilegios creados',
              timer: 1400,
              showConfirmButton: false,
            });
            this.reload();
          },
          error: (e: any) => {
            console.error(e);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudieron crear los privilegios.',
            });
          },
        });
    });
  }
}
