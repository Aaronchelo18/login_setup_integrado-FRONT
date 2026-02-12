// src/app/pages/setup/access/pages/role-access-tree/role-access-tree.page.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RoleService } from '../../../../../core/services/role/role.service';
import { ToastService } from '../../../../../shared/interfaces/toast/toast.service';
import { PrivilegesModalComponent } from '../../components/privileges-modal/privileges-modal.component';
import { TreeResponse, Node as ModuleNode } from '../../../../../models/role/node.tree.model';


@Component({
  selector: 'app-role-access-tree',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  templateUrl: './role-access-tree.page.html',
  styleUrls: ['./role-access-tree.page.css'],
  imports: [CommonModule, FormsModule, PrivilegesModalComponent],
})
export class RoleAccessTreePage implements OnInit {
  idRol!: number;
  idRoot!: number;

  roleName = '';
  roleEstado: '0' | '1' | '' = '';

  loading = true;
  saving = false;

  tree: ModuleNode[] = [];

  result = {
  show: false as boolean,
  type: 'success' as 'success'|'error',
  title: '',
  message: ''
};

private showResult(type: 'success'|'error', title: string, message: string) {
  this.result = { show: true, type, title, message };
}

hideResult() { this.result.show = false; }

  // Modal de privilegios
  showPrivs = false;
  privTarget: { id_modulo: number; nombre: string } | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: RoleService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    const idRolParam = this.route.snapshot.paramMap.get('idRol');
    const idRootParam = this.route.snapshot.paramMap.get('idRoot');

    if (!idRolParam || !idRootParam) {
      this.toast.error('Faltan parámetros en la ruta');
      this.router.navigate(['/setup/accesos/roles']);
      return;
    }

    this.idRol = +idRolParam;
    this.idRoot = +idRootParam;

    // Estado que pudo venir de la pantalla anterior
    const navState = this.router.getCurrentNavigation()?.extras?.state as any;
    if (navState?.roleName) this.roleName = navState.roleName;
    if (navState?.roleEstado) this.roleEstado = navState.roleEstado;

    this.loadTree();
  }

  private loadTree(): void {
    this.loading = true;

    this.api.getRoleTreeByRoot(this.idRol, this.idRoot).subscribe({
      next: (res: TreeResponse) => {
        // role (opcional)
        if (res?.role) {
          this.roleName = (res.role?.nombre ?? this.roleName) || `Rol #${this.idRol}`;
          const est = res.role?.estado;
          this.roleEstado =
            (est === 1 || est === '1') ? '1' :
            (est === 0 || est === '0') ? '0' : this.roleEstado;
        } else if (!this.roleName) {
          this.roleName = `Rol #${this.idRol}`;
        }

        const data = Array.isArray(res?.data) ? res.data : [];
        // normalizamos, respetando hasPriv que viene del backend
        this.tree = data.map(n => this.normalizeNode(n, null));

        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toast.error('No se pudo cargar el árbol de módulos');
      },
    });
  }

  /** Asegura booleanos y setea __parent__ recursivamente sin tocar hasPriv */
  private normalizeNode(n: ModuleNode, parent: ModuleNode | null): ModuleNode {
    const node: ModuleNode = {
      id_modulo: n.id_modulo,
      nombre: n.nombre,
      checked: !!n.checked,
      hasPriv: !!n.hasPriv,   // <- RESPETAMOS lo que envía el backend
      nivel: n.nivel,
      __parent__: parent,
      children: [],
    };

    if (Array.isArray(n.children) && n.children.length) {
      node.children = n.children.map(c => this.normalizeNode(c, node));
    }

    return node;
  }

  toggle(node: ModuleNode, value?: boolean) {
    const v = value !== undefined ? value : !node.checked;
    this.setDown(node, v);
    this.bubbleUp(node.__parent__);
  }

  private setDown(n: ModuleNode, v: boolean) {
    n.checked = v;
    n.children?.forEach(c => this.setDown(c, v));
  }

  private bubbleUp(parent?: ModuleNode | null) {
    if (!parent) return;
    const anyOn = (parent.children ?? []).some(c => !!c.checked);
    parent.checked = anyOn;
    this.bubbleUp(parent.__parent__);
  }

  private collectChecked(n: ModuleNode, out: number[]) {
    if (n.checked) out.push(n.id_modulo);
    n.children?.forEach(c => this.collectChecked(c, out));
  }

  checkAll(v: boolean) {
    this.tree.forEach(root => this.setDown(root, v));
  }

  save() {
  if (this.saving) return;
  this.saving = true;

  const seleccionados: number[] = [];
  this.tree.forEach(r => this.collectChecked(r, seleccionados));

  this.api.putRoleModulesByRoot(this.idRol, this.idRoot, seleccionados)
    .subscribe({
      next: (r) => {
        this.saving = false;
        const count = r?.count ?? seleccionados.length;
        this.toast.success(`Cambios guardados (${count})`);
      },
      error: (e) => {
        this.saving = false;
        const msg = e?.error?.message || 'No se pudo guardar (500)';
        this.toast.error(msg);
        console.error('PUT /modulos error:', e);
      }
    });
}

  back() {
    this.router.navigate(
      ['/setup/accesos/role', this.idRol, 'apps'],
      { state: { roleName: this.roleName, roleEstado: this.roleEstado } }
    );
  }

  openPrivs(n: { id_modulo: number; nombre: string; hasPriv?: boolean; checked?: boolean }) {
    if (!n?.hasPriv) return; // sin privilegios definidos => no hay modal
    if (!n?.checked) {
      this.toast.warning('Primero asigna el módulo para configurar privilegios');
      return;
    }
    this.privTarget = { id_modulo: n.id_modulo, nombre: n.nombre };
    this.showPrivs = true;
  }

  onClosePrivs(saved: boolean) {
  this.showPrivs = false;
  this.privTarget = null;

  if (saved) {
    // ✅ aparece el pop-up centrado
    this.showResult('success', 'Cambios guardados', 'Los privilegios se asignaron correctamente.');
  } else {
    // opcional si quieres mostrar error cuando se cierre sin guardar
    // this.showResult('error', 'Sin cambios', 'No se realizaron modificaciones.');
  }
}


  trackById = (_: number, item: { id_modulo: number }) => item.id_modulo;
}
