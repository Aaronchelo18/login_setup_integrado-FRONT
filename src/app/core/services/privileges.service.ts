// src/app/core/services/privileges.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/** === Tipos base del API “clásico” (por si aún lo usas en otro lado) === */
export type PrivilegioRow = {
  id_privilegio: number;
  id_modulo: number;
  nombre: string;
  clave: string | null;        // "Crear" | "Listar" | "Editar" | "Eliminar" | null
  valor: string | null;
  comentario: string | null;
  estado: '0' | '1';
};

/** === Tipos del API tree-matrix tal como lo definiste en backend === */
export type ModuleInfo = {
  id_modulo: number;
  id_parent: number;
  nombre: string;
  nivel: string;   // "0" | "1" | ...
  url: string | null;
  imagen: string | null;
  estado: '0' | '1';
};

export type MatrixCell = {
  nombre: string;
  crear: '0' | '1';
  listar: '0' | '1';
  editar: '0' | '1';
  eliminar: '0' | '1';
};

export type TreeMatrixAPI = {
  modules: Array<{ module: ModuleInfo; matrix: MatrixCell[] }>;
};

/** === Tipos simplificados para el UI de tu nuevo panel === */
export type PrivFlag = {
  crear: boolean;
  listar: boolean;
  editar: boolean;
  eliminar: boolean;
};

export type TreeMatrixRow = {
  id_modulo: number;
  modulo: string;
  flags: PrivFlag;
};

@Injectable({ providedIn: 'root' })
export class PrivilegesService {
  // base = http://.../api/config/setup/modulos
  private base =
    `${environment?.apiUrl?.code5 ?? 'http://localhost:5017'}`
      .replace(/\/+$/, '') + `/api/config/setup/modulos`;

  constructor(private http: HttpClient) {}

  /** ===== Endpoints "clásicos" por módulo ===== */
  list(id_modulo: number): Observable<PrivilegioRow[]> {
    return this.http
      .get<{ success: boolean; data: PrivilegioRow[] }>(`${this.base}/${id_modulo}/privilegios`)
      .pipe(map(r => r.data ?? []));
  }

  bulk(
    id_modulo: number,
    items: Array<{ nombre: string; crear?: boolean; listar?: boolean; editar?: boolean; eliminar?: boolean }>,
    removed?: string[]
  ) {
    const body: any = { items };
    if (removed?.length) body.removed = removed;
    return this.http.post<{ success: boolean }>(`${this.base}/${id_modulo}/privilegios/bulk`, body);
  }

  /** ======= TREE-MATRIX ======= */

  /**
   * GET /{parentId}/privilegios/tree-matrix
   * El backend devuelve { modules: [{ module, matrix:[{crear/listar/editar/eliminar}...] }]}
   * Aquí agregamos por módulo: flag = OR lógico de todas sus filas.
   */
  getTreeMatrix(parentId: number): Observable<TreeMatrixRow[]> {
    return this.http
      .get<{ success: boolean; data: TreeMatrixAPI }>(`${this.base}/${parentId}/privilegios/tree-matrix`)
      .pipe(
        map((r) => {
          const mods = r?.data?.modules ?? [];
          return mods.map(item => {
            const rows = item.matrix ?? [];
            const agg = rows.reduce(
              (acc, m) => ({
                crear: acc.crear || m.crear === '1',
                listar: acc.listar || m.listar === '1',
                editar: acc.editar || m.editar === '1',
                eliminar: acc.eliminar || m.eliminar === '1',
              }),
              { crear: false, listar: false, editar: false, eliminar: false } as PrivFlag
            );
            return {
              id_modulo: item.module.id_modulo,
              modulo: item.module.nombre,
              flags: agg,
            } as TreeMatrixRow;
          });
        })
      );
  }

  /**
   * POST /{parentId}/privilegios/tree-matrix
   * Enviamos módulos con flags booleanos; el backend hace el upsert en cascada.
   */
  assignTreeMatrix(parentId: number, items: TreeMatrixRow[]) {
    const body = {
      modules: items.map(i => ({
        id_modulo: i.id_modulo,
        crear: !!i.flags.crear,
        listar: !!i.flags.listar,
        editar: !!i.flags.editar,
        eliminar: !!i.flags.eliminar,
      })),
    };
    return this.http.post<{ success: boolean; message?: string }>(
      `${this.base}/${parentId}/privilegios/tree-matrix`,
      body
    );
  }

  /** Alias si en algún lugar antiguo llamabas a saveTreeMatrix(...) */
  saveTreeMatrix(parentId: number, nodes: { info?: ModuleInfo; rows?: any[] }[] | TreeMatrixRow[]) {
    // Soporta ambos contratos por compatibilidad
    const isSimple = Array.isArray(nodes) && (nodes as any[])[0]?.flags !== undefined;
    if (isSimple) {
      return this.assignTreeMatrix(parentId, nodes as TreeMatrixRow[]);
    }
    // contrato antiguo (por si quedó en otra pantalla): agregamos por fila
    const list = (nodes as any[]).map((n: any) => {
      const agg: PrivFlag = (n.rows ?? []).reduce(
        (acc: PrivFlag, r: any) => ({
          crear: acc.crear || !!r.crear,
          listar: acc.listar || !!r.listar,
          editar: acc.editar || !!r.editar,
          eliminar: acc.eliminar || !!r.eliminar,
        }),
        { crear: false, listar: false, editar: false, eliminar: false }
      );
      return { id_modulo: n.info.id_modulo, modulo: n.info.nombre, flags: agg } as TreeMatrixRow;
    });
    return this.assignTreeMatrix(parentId, list);
  }

  /** ======= NUEVO: crear/asegurar catálogo CRUD para un módulo ======= */
  createCatalog(
    id_modulo: number,
    payload: { nombre: string; acciones: string[]; estado?: '0' | '1' }
  ): Observable<any> {
    return this.http.post(
      `${this.base}/${id_modulo}/privilegios/catalog-create`,
      payload
    );
  }
}
