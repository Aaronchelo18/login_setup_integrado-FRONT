import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, tap, catchError } from 'rxjs/operators';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CreateRoleDto, Role } from '../../../models/role/role.model';
import { TreeByRootResponse } from '../../../models/role/role.privileges';

type ApiList<T> = { success: boolean; data: T[] };
type ApiAssigned = { success: boolean; data: { id_rol: number }[] };
type ApiSave = { success: boolean; message?: string };

@Injectable({ providedIn: 'root' })
export class RoleService {
  // Sincronizado con el prefijo de tu nuevo api.php
  private base = `${environment.apiUrl.code5}/api/application-management/access-control`;

  // SISTEMA DE CACHÉ
  private rolesCache$ = new BehaviorSubject<Role[] | null>(null);

  constructor(private http: HttpClient) { }

  /** Obtiene roles con caché para carga instantánea */
  getRoles(force = false): Observable<Role[]> {
    if (!force && this.rolesCache$.value) {
      return of(this.rolesCache$.value);
    }
    return this.http.get<any>(this.base).pipe(
      map(res => (res?.data ?? []).map((r: any) => ({
        id_rol: Number(r.id_rol),
        nombre: String(r.nombre ?? ''),
        estado: String(r.estado) as '0' | '1',
      }))),
      tap(roles => this.rolesCache$.next(roles)),
      catchError(() => of([]))
    );
  }

  refreshRoles() {
    this.getRoles(true).subscribe();
  }

  createRole(dto: CreateRoleDto): Observable<Role> {
    return this.http.post<any>(this.base, dto).pipe(
      map(res => {
        const d = res?.data ?? {};
        this.refreshRoles();
        return {
          id_rol: Number(d.id_rol),
          nombre: String(d.nombre ?? dto.nombre),
          estado: String(d.estado ?? dto.estado) as '0' | '1',
        } as Role;
      })
    );
  }

  updateRole(idRol: number, dto: Partial<CreateRoleDto & { estado?: string }>): Observable<Role> {
    const payload: any = { ...dto };
    if (dto.estado !== undefined) {
      payload.estado = typeof dto.estado === 'string' ? (dto.estado === '1' ? 1 : dto.estado === '0' ? 0 : dto.estado) : dto.estado;
    }

    return this.http.put<any>(`${this.base}/role/${idRol}`, payload).pipe(
      map(res => {
        const d = res?.data ?? res?.role ?? res ?? {};
        this.refreshRoles();
        return {
          id_rol: Number(d.id_rol ?? idRol),
          nombre: String(d.nombre ?? dto.nombre ?? ''),
          estado: String(d.estado ?? dto.estado ?? (d.estado === 1 ? '1' : d.estado === 0 ? '0' : '0')) as '0' | '1',
        } as Role;
      })
    );
  }

  updateStatus(idRol: number, estado: '0' | '1' | number) {
    const payload: any = { estado: typeof estado === 'number' ? estado : (estado === '1' ? 1 : 0) };
    return this.http.put<any>(`${this.base}/role/${idRol}/status`, payload).pipe(
      map(res => {
        const d = res?.data ?? res?.role ?? res ?? {};
        this.refreshRoles();
        return {
          id_rol: Number(d.id_rol ?? idRol),
          nombre: String(d.nombre ?? ''),
          estado: String(d.estado ?? (d.estado === 1 ? '1' : d.estado === 0 ? '0' : payload.estado ? String(payload.estado) : '0')) as '0' | '1',
        } as Role;
      })
    );
  }

  updateName(idRol: number, nombre: string) {
    const payload = { nombre };
    return this.http.put<any>(`${this.base}/role/${idRol}`, payload).pipe(
      map(res => {
        const d = res?.data ?? res?.role ?? res ?? {};
        this.refreshRoles();
        return {
          id_rol: Number(d.id_rol ?? idRol),
          nombre: String(d.nombre ?? nombre),
          estado: String(d.estado ?? '0') as '0' | '1',
        } as Role;
      })
    );
  }

  deleteRole(idRol: number) {
    return this.http.delete<any>(`${this.base}/role/${idRol}`).pipe(
      tap(() => this.refreshRoles())
    );
  }

  updateRoleModules(idRol: number, modulos: number[]) {
    return this.http.post(`${this.base}/role/${idRol}/modulos`, { modulos });
  }

  getRoleModulesTree(idRol: number) {
    return this.http.get<{
      success: boolean;
      role: { id_rol: number; nombre: string; estado: number | '0' | '1' };
      data: Array<{ id_modulo: number; nombre: string; checked: any; children?: any[] }>;
    }>(`${this.base}/role/${idRol}/modulos-tree`);
  }

  getRoleTreeByRoot(idRol: number, idRoot: number) {
    return this.http.get<TreeByRootResponse>(
      `${this.base}/role/${idRol}/root/${idRoot}`
    );
  }

  syncRoleModules(idRol: number, modulos: number[]) {
    return this.http.post(`${this.base}/role/${idRol}/modulos`, { modulos });
  }

  putRoleModulesByRoot(idRol: number, idRoot: number, modulos: number[]) {
    return this.http.put<{success:boolean; count:number}>(
      `${this.base}/role/${idRol}/root/${idRoot}/sync`,
      { modulos }
    );
  }

  getModulePrivilegeCatalog(idModulo: number) {
    return this.http.get<any>(`${environment.apiUrl.code5}/api/application-management/modules/${idModulo}/privilegios`);
  }

  getAssignedPrivileges(idRol: number, idModulo: number) {
    return this.http.get<any>(`${this.base}/role/${idRol}/modulos/${idModulo}/privilegios`);
  }

  saveRoleModulePrivileges(idRol: number, idModulo: number, privilegios: number[]) {
    return this.http.post<any>(
      `${this.base}/role/${idRol}/modulos/${idModulo}/privilegios`,
      { privilegios }
    );
  }

  getPrivilegesByModule(idRol: number, idModulo: number): Observable<{ success: boolean; data: any[] }> {
    const url = `${this.base}/role/${idRol}/modulos/${idModulo}/privilegios`;
    return this.http.get<{ success: boolean; data: any[] }>(url);
  }

  putPrivilegesByModule(idRol: number, idModulo: number, privilegios: number[]): Observable<{ success: boolean }> {
    const url = `${this.base}/role/${idRol}/modulos/${idModulo}/privilegios`;
    return this.http.put<{ success: boolean }>(url, { privilegios });
  }

  list(): Observable<ApiList<{ id_rol: number; nombre: string }>> {
    return this.http.get<ApiList<{ id_rol: number; nombre: string }>>(`${this.base}`);
  }

  assignedToUser(id_persona: number): Observable<ApiAssigned> {
    return this.http.get<ApiAssigned>(`${environment.apiUrl.code5}/api/iam/role-assignment/${id_persona}/roles`);
  }

  saveForUser(id_persona: number, roleIds: number[]): Observable<ApiSave> {
    return this.http.post<ApiSave>(`${environment.apiUrl.code5}/api/iam/role-assignment/${id_persona}/roles`, { roles: roleIds });
  }
}