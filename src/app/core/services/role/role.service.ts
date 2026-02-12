import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CreateRoleDto, Role } from '../../../models/role/role.model';
import { TreeByRootResponse } from '../../../models/role/role.privileges';


type ApiList<T> = { success: boolean; data: T[] };
type ApiAssigned = { success: boolean; data: { id_rol: number }[] };
type ApiSave = { success: boolean; message?: string };

@Injectable({ providedIn: 'root' })
export class RoleService {
  private base = `${environment.apiUrl.code5}/api/v1/config/roles`;

  constructor(private http: HttpClient) { }

  getRoles(): Observable<Role[]> {
    return this.http.get<any>(this.base).pipe(
      map(res => (res?.data ?? []).map((r: any) => ({
        id_rol: Number(r.id_rol),
        nombre: String(r.nombre ?? ''),
        estado: String(r.estado) as '0' | '1',
      })))
    );
  }

  createRole(dto: CreateRoleDto): Observable<Role> {
    return this.http.post<any>(this.base, dto).pipe(
      map(res => {
        const d = res?.data ?? {};
        return {
          id_rol: Number(d.id_rol),
          nombre: String(d.nombre ?? dto.nombre),
          estado: String(d.estado ?? dto.estado) as '0' | '1',
        } as Role;
      })
    );
  }

  updateRole(idRol: number, dto: Partial<CreateRoleDto & { estado?: string }>): Observable<Role> {
    // Normalizar payload: algunos backends esperan 0/1 numérico en lugar de '0'|'1'
    const payload: any = { ...dto };
    if (dto.estado !== undefined) {
      // mantener si ya es número
      payload.estado = typeof dto.estado === 'string' ? (dto.estado === '1' ? 1 : dto.estado === '0' ? 0 : dto.estado) : dto.estado;
    }

    return this.http.put<any>(`${this.base}/${idRol}`, payload).pipe(
      map(res => {
        // aceptar varias formas de respuesta: res.data, res.role o la propia res
        const d = res?.data ?? res?.role ?? res ?? {};
        return {
          id_rol: Number(d.id_rol ?? idRol),
          nombre: String(d.nombre ?? dto.nombre ?? ''),
          estado: String(d.estado ?? dto.estado ?? (d.estado === 1 ? '1' : d.estado === 0 ? '0' : '0')) as '0' | '1',
        } as Role;
      })
    );
  }

  /** Actualiza solo el estado via /roles/{id}/status */
  updateStatus(idRol: number, estado: '0' | '1' | number) {
    const payload: any = { estado: typeof estado === 'number' ? estado : (estado === '1' ? 1 : 0) };
    return this.http.put<any>(`${this.base}/${idRol}/status`, payload).pipe(
      map(res => {
        const d = res?.data ?? res?.role ?? res ?? {};
        return {
          id_rol: Number(d.id_rol ?? idRol),
          nombre: String(d.nombre ?? ''),
          estado: String(d.estado ?? (d.estado === 1 ? '1' : d.estado === 0 ? '0' : payload.estado ? String(payload.estado) : '0')) as '0' | '1',
        } as Role;
      })
    );
  }

  /** Actualiza solo el nombre via /roles/{id} */
  updateName(idRol: number, nombre: string) {
    const payload = { nombre };
    return this.http.put<any>(`${this.base}/${idRol}`, payload).pipe(
      map(res => {
        const d = res?.data ?? res?.role ?? res ?? {};
        return {
          id_rol: Number(d.id_rol ?? idRol),
          nombre: String(d.nombre ?? nombre),
          estado: String(d.estado ?? '0') as '0' | '1',
        } as Role;
      })
    );
  }

  /** Eliminar rol */
  deleteRole(idRol: number) {
    return this.http.delete<any>(`${this.base}/${idRol}`);
  }

  updateRoleModules(idRol: number, modulos: number[]) {
    return this.http.post(`${this.base}/${idRol}/modulos`, {
      modulos
    });
  }

  getRoleModulesTree(idRol: number) {
    return this.http.get<{
      success: boolean;
      role: { id_rol: number; nombre: string; estado: number | '0' | '1' };
      data: Array<{ id_modulo: number; nombre: string; checked: any; children?: any[] }>;
    }>(`${this.base}/${idRol}/modulos-tree`);
  }

  getRoleTreeByRoot(idRol: number, idRoot: number) {
    return this.http.get<TreeByRootResponse>(
      `${this.base}/${idRol}/modulos/${idRoot}/tree`
    );
  }

  syncRoleModules(idRol: number, modulos: number[]) {
    return this.http.post(
      `${this.base}/${idRol}/modulos`,
      { modulos }
    );

  }
  putRoleModulesByRoot(idRol: number, idRoot: number, modulos: number[]) {
    return this.http.put<{success:boolean; count:number}>(
      `${this.base}/${idRol}/modulos/${idRoot}`,
      { modulos }
    );
  }

  getModulePrivilegeCatalog(idModulo: number) {
    return this.http.get<any>(`${environment.apiUrl.code5}/api/v1/config/modulos/${idModulo}/privilegios`);
  }
  getAssignedPrivileges(idRol: number, idModulo: number) {
    return this.http.get<any>(`${environment.apiUrl.code5}/api/v1/config/roles/${idRol}/modulos/${idModulo}/privilegios`);
  }
  saveRoleModulePrivileges(idRol: number, idModulo: number, privilegios: number[]) {
    return this.http.post<any>(
      `${environment.apiUrl.code5}/api/v1/config/roles/${idRol}/modulos/${idModulo}/privilegios`,
      { privilegios }
    );
  }

  getPrivilegesByModule(idRol: number, idModulo: number): Observable<{ success: boolean; data: any[] }> {
    const url = `${this.base}/${idRol}/modulos/${idModulo}/privilegios`;
    return this.http.get<{ success: boolean; data: any[] }>(url);
  }

  putPrivilegesByModule(idRol: number, idModulo: number, privilegios: number[]): Observable<{ success: boolean }> {
    const url = `${this.base}/${idRol}/modulos/${idModulo}/privilegios`;
    return this.http.put<{ success: boolean }>(url, { privilegios });
  }

   list(): Observable<ApiList<{ id_rol: number; nombre: string }>> {
    return this.http.get<ApiList<{ id_rol: number; nombre: string }>>(`${this.base}`);
  }

   assignedToUser(id_persona: number): Observable<ApiAssigned> {
    return this.http.get<ApiAssigned>(`${this.base}/users/${id_persona}/roles`);
  }

  saveForUser(id_persona: number, roleIds: number[]): Observable<ApiSave> {
    return this.http.post<ApiSave>(`${this.base}/users/${id_persona}/roles`, { roles: roleIds });
  }

}
