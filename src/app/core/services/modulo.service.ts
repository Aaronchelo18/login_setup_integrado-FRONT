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

  /** ===== MÉTODOS DE MÓDULOS ===== */
  getModulosAdmin(): Observable<Modulo[]> {
    const url = `${this.baseAppManag}/modules/admin-list`; 
    return this.http.get<any>(url).pipe(
      map(r => r.data || []),
      catchError((err) => {
        console.error("Error en listado-admin:", err);
        return of([]);
      })
    );
  }

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

  /** ===== OPERACIONES CRUD (Actualizan el caché) ===== */
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

  /** ===== OBTENCIÓN DE PADRES (Con Caché Instantáneo) ===== */
  getPadres(force = false): Observable<any[]> {
    // Si ya hay datos y no forzamos, entregamos lo que tenemos
    if (!force && this.padresCache$.value) {
      return of(this.padresCache$.value);
    }

    return this.http.get<any>(`${this.baseAppManag}/modules/arbol`).pipe(
      map(r => r.data || r),
      tap(data => this.padresCache$.next(data)), // Guardamos en memoria
      catchError(() => of([]))
    );
  }

  private invalidateCache() {
    this.getPadres(true).subscribe(); // Refresca memoria
    this.reloadSidebar$.next();      // Avisa al Sidebar
  }
}