import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpBackend } from '@angular/common/http';
import { Observable, Subject, of, BehaviorSubject } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Modulo, ModuloOption } from '../../models/modulo.model';

@Injectable({ providedIn: 'root' })
export class ModuloService {
  private apiRoot = `${environment?.apiUrl?.code5 ?? 'http://localhost:5017'}`.replace(/\/+$/, '') + `/api`;
  private baseAppManag = `${this.apiRoot}/application-management`;
  private baseIam = `${this.apiRoot}/iam`;
  
  readonly reloadSidebar$ = new Subject<void>();
  private silentHttp: HttpClient;

  // --- SISTEMA DE CACHÉ ---
  private padresCache$ = new BehaviorSubject<any[] | null>(null);

  constructor(private http: HttpClient, handler: HttpBackend) {
    this.silentHttp = new HttpClient(handler);
  }

  /** ===== MÉTODOS PARA DASHBOARD (KPIs) ===== */
  getStatsRoles(): Observable<any[]> {
    return this.http.get<any>(`${this.baseIam}/roles`).pipe(
      map(r => r.data || r || []),
      catchError(() => of([]))
    );
  }

  getStatsUsers(): Observable<any[]> {
    return this.http.get<any>(`${this.baseIam}/role-assignment/users`).pipe(
      map(r => r.data || r || []),
      catchError(() => of([]))
    );
  }

  getStatsAccesos(): Observable<any[]> {
    return this.http.get<any>(`${this.baseIam}/user-access/reports`).pipe(
      map(r => r.data || r || []),
      catchError(() => of([]))
    );
  }

  /** ===== MÉTODOS DE MÓDULOS (ADMINISTRACIÓN SIN FILTROS) ===== */
  
  getModulosAdmin(): Observable<Modulo[]> {
    // CRUD Administrativo: Lista completa sin restricciones de persona
    const url = `${this.baseAppManag}/modules/admin-list`; 
    return this.http.get<any>(url).pipe(
      map(r => r.data || []),
      catchError((err) => {
        console.error("Error en listado-admin:", err);
        return of([]);
      })
    );
  }

  /** ===== OPERACIONES CRUD COMPLETAS ===== */

  create(data: any): Observable<any> {
    return this.http.post(`${this.baseAppManag}/modules`, data).pipe(
      tap(() => this.invalidateCache())
    );
  }

  update(id: number, data: any): Observable<any> {
    return this.http.put(`${this.baseAppManag}/modules/${id}`, data).pipe(
      tap(() => this.invalidateCache())
    );
  }

  remove(id: number): Observable<any> {
    return this.http.delete(`${this.baseAppManag}/modules/${id}`).pipe(
      tap(() => this.invalidateCache())
    );
  }

  /** ===== MÉTODOS DE MÓDULOS (VISTA DE USUARIO CON ID_PERSONA) ===== */

  getModulos(opts?: { id_persona?: number | null, force?: boolean }): Observable<Modulo[]> {
    let params = new HttpParams();
    if (opts?.id_persona) params = params.set('id_persona', opts.id_persona.toString());
    
    return this.http.get<any>(`${this.baseAppManag}/modules`, { params }).pipe(
      map(r => r.data || r),
      catchError(() => of([]))
    );
  }

  getOptions(include_inactives = true): Observable<ModuloOption[]> {
    return this.silentHttp.get<any>(`${this.baseAppManag}/modules/opciones?include_inactives=${include_inactives}`).pipe(
      map(r => r.data || r), 
      catchError(() => of([]))
    );
  }

  /** ===== OBTENCIÓN DE PADRES (Con Caché Instantáneo) ===== */
  getPadres(force = false): Observable<any[]> {
    if (!force && this.padresCache$.value) {
      return of(this.padresCache$.value);
    }

    return this.http.get<any>(`${this.baseAppManag}/modules/arbol`).pipe(
      map(r => r.data || r),
      tap(data => this.padresCache$.next(data)),
      catchError(() => of([]))
    );
  }

  private invalidateCache() {
    this.getPadres(true).subscribe();
    this.reloadSidebar$.next();
  }
}