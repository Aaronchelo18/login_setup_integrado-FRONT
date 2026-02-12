// src/app/pages/setup/access/components/privileges-modal/privileges-modal.component.ts
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RoleService } from '../../../../../core/services/role/role.service';

type PrivRow = { id_privilegio: number; nombre: string; checked?: boolean };

@Component({
  selector: 'app-privileges-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './privileges-modal.component.html',
  styleUrls: ['./privileges-modal.component.css'],
  
})
export class PrivilegesModalComponent implements OnChanges {
  @Input() show = false;
  @Input() idRol!: number;
  @Input() target: { id_modulo: number; nombre: string } | null = null;

  @Output() closed = new EventEmitter<boolean>();

  loading = false;
  saving  = false;
  error   = '';

  list: PrivRow[] = [];

  constructor(private api: RoleService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (this.show && this.target && this.idRol) {
      this.load();
    }
  }

  private load(): void {
    this.loading = true;
    this.error   = '';
    this.list    = [];

    const idModulo = this.target!.id_modulo;

    this.api.getModulePrivilegeCatalog(idModulo).subscribe({
      next: (cat: any) => {
        const catalog: PrivRow[] = (cat?.data || []).map((x: any) => ({
          id_privilegio: Number(x.id_privilegio),
          nombre: String(x.nombre),
          checked: false
        }));

        this.api.getAssignedPrivileges(this.idRol, idModulo).subscribe({
          next: (asig: any) => {
            const ids: number[] = (asig?.data || []).map((v: any) => Number(v));
            this.list = catalog.map(c => ({ ...c, checked: ids.includes(c.id_privilegio) }));
            this.loading = false;
          },
          error: e => {
            this.error   = e?.error?.message || 'No se pudo obtener privilegios asignados';
            this.list    = catalog;
            this.loading = false;
          }
        });
      },
      error: e => {
        this.error   = e?.error?.message || 'No se pudo cargar el catálogo de privilegios';
        this.loading = false;
      }
    });
  }

  toggleAll(v: boolean) {
    this.list = this.list.map(p => ({ ...p, checked: v }));
  }

  save(): void {
    if (!this.target) return;
    if (this.saving) return;

    this.saving = true;
    const idsSelected = this.list.filter(x => !!x.checked).map(x => x.id_privilegio);

    this.api.saveRoleModulePrivileges(this.idRol, this.target.id_modulo, idsSelected).subscribe({
      next: () => {
        this.saving = false;
        this.closed.emit(true);
      },
      error: (e) => {
        this.saving = false;
        this.error  = e?.error?.message || 'No se pudo guardar los privilegios';
      }
    });
  }

  close(): void {
    this.closed.emit(false);
  }
  get allChecked(): boolean {
  return this.list?.length > 0 && this.list.every(p => !!p.checked);
}

}