// src/app/pages/setup/roles/state/roles.facade.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { normalizeName } from '../utils/role.utils';
import { RoleService } from '../../../../core/services/role/role.service';
import { CreateRoleDto, Role } from '../../../../models/role/role.model';

type EstadoFiltro = 'todos' | 'activo' | 'inactivo';

@Injectable({ providedIn: 'root' })
export class RolesFacade {
  private roles$ = new BehaviorSubject<Role[]>([]);
  private loading$ = new BehaviorSubject<boolean>(false);
  private filtro: { estado: EstadoFiltro; busqueda?: string } = { estado: 'todos' };

  constructor(private api: RoleService) {}

  // Expuestos
  get loading(): Observable<boolean> { return this.loading$.asObservable(); }
  get list(): Observable<Role[]> { return this.roles$.asObservable().pipe(map(() => this.filtered())); }

  setEstado(estado: EstadoFiltro) { this.filtro.estado = estado; this.roles$.next(this.roles$.value); }
  setBusqueda(q: string) { this.filtro.busqueda = q; this.roles$.next(this.roles$.value); }

  load(): void {
    this.loading$.next(true);
    this.api.getRoles().subscribe({
      next: (data) => {
        const parsed: Role[] = (data ?? []).map((r: any) => ({
          id_rol: Number(r.id_rol),
          nombre: String(r.nombre ?? ''),
          estado: String(r.estado) as '0' | '1',
        }));
        this.roles$.next(parsed);
        this.loading$.next(false);
      },
      error: () => this.loading$.next(false),
    });
  }

  toggle(role: Role) {
    const nuevo = role.estado === '1' ? '0' : '1';
    return this.api.updateRole(role.id_rol, { estado: nuevo }).pipe(
      tap((updated: Role) => {
        const arr = this.roles$.value.map(r => r.id_rol === updated.id_rol ? updated : r);
        this.roles$.next(arr);
      })
    );
  }

  optimisticToggle(role: Role) {
    const prev = this.roles$.value.slice();
    const updatedLocal: Role[] = prev.map(r => r.id_rol === role.id_rol
      ? { ...r, estado: (r.estado === '1' ? '0' : '1') as '0' | '1' }
      : r
    );
    this.roles$.next(updatedLocal);

    const nuevo = role.estado === '1' ? '0' : '1';
    return this.api.updateStatus(role.id_rol, nuevo).pipe(
      tap((updated: Role) => {
        const arr = this.roles$.value.map(r => r.id_rol === updated.id_rol ? updated : r);
        this.roles$.next(arr);
      }),
      catchError(err => {
        this.roles$.next(prev);
        return throwError(() => err);
      })
    );
  }

  /** Elimina un rol y actualiza la lista local */
  delete(role: Role) {
    return this.api.deleteRole(role.id_rol).pipe(
      tap(() => {
        const arr = this.roles$.value.filter(r => r.id_rol !== role.id_rol);
        this.roles$.next(arr);
      })
    );
  }

  /** Actualiza sólo el nombre del rol */
  updateName(idRol: number, nombre: string) {
    return this.api.updateName(idRol, nombre).pipe(
      tap((updated: Role) => {
        const arr = this.roles$.value.map(r => r.id_rol === updated.id_rol ? updated : r);
        this.roles$.next(arr);
      })
    );
  }

create(dto: CreateRoleDto): Observable<Role> {
  const exists = this.roles$.value.some(
    r => normalizeName(r.nombre) === normalizeName(dto.nombre)
  );
  if (exists) return throwError(() => ({ code: 'DUPLICATE', message: 'Rol ya existente' }));

  return this.api.createRole(dto);
}

  private filtered(): Role[] {
    const roles = this.roles$.value;
    const q = (this.filtro.busqueda ?? '').trim().toLowerCase();
    const est = this.filtro.estado;
    return roles.filter(r => {
      const okText = q ? (r.nombre ?? '').toLowerCase().includes(q) : true;
      const okEst = est === 'todos' ? true : est === 'activo' ? r.estado === '1' : r.estado === '0';
      return okText && okEst;
    });
  }
}
