import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpBackend } from '@angular/common/http';
import { Observable, Subject, of, BehaviorSubject } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Modulo, ModuloOption } from '../../models/modulo.model';

@Injectable({ providedIn: 'root' })
export class ModuloService {
  // Aseguramos que la URL no termine en slash para concatenar limpio
  private apiRoot = (environment?.apiUrl?.code5 || 'http://localhost:5017').replace(/\/+$/, '');
  private baseAppManag = `${this.apiRoot}/api/application-management`;
  private baseIam = `${this.apiRoot}/api/iam`;
  
  readonly reloadSidebar$ = new Subject<void>();
  private silentHttp: HttpClient;
  private padresCache$ = new BehaviorSubject<any[] | null>(null);

  constructor(private http: HttpClient, handler: HttpBackend) {
    this.silentHttp = new HttpClient(handler);
  }

  /** KPIs Dashboard */
  getStatsRoles(): Observable<any[]> {
    return this.http.get<any>(`${this.baseIam}/roles`).pipe(map(r => r.data || r || []), catchError(() => of([])));
  }
  getStatsUsers(): Observable<any[]> {
    return this.http.get<any>(`${this.baseIam}/role-assignment/users`).pipe(map(r => r.data || r || []), catchError(() => of([])));
  }
  getStatsAccesos(): Observable<any[]> {
    return this.http.get<any>(`${this.baseIam}/user-access/reports`).pipe(map(r => r.data || r || []), catchError(() => of([])));
  }

  /** CRUD ADMIN */
  getModulosAdmin(): Observable<Modulo[]> {
    return this.http.get<any>(`${this.baseAppManag}/modules/admin-list`).pipe(map(r => r.data || []), catchError(() => of([])));
  }

  /** * POST DEFINITIVO: URL limpia según tu prueba exitosa 
   */
create(data: any): Observable<any> {
  const url = `${this.baseAppManag}/modules/store-basic`;

  // 🔥 Solo enviamos lo que el backend espera
  const payload = {
    nombre: data.nombre,
    id_parent: Number(data.id_parent ?? 0)
  };

  return this.http.post(url, payload, {
    headers: { 'Content-Type': 'application/json' }
  }).pipe(
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

  /** VISTAS Y OPCIONES */
  getModulos(opts?: { id_persona?: number | null, force?: boolean }): Observable<Modulo[]> {
    let params = new HttpParams();
    if (opts?.id_persona) params = params.set('id_persona', opts.id_persona.toString());
    return this.http.get<any>(`${this.baseAppManag}/modules`, { params }).pipe(map(r => r.data || r), catchError(() => of([])));
  }

  getOptions(include_inactives = true): Observable<ModuloOption[]> {
    const url = `${this.baseAppManag}/modules/opciones?include_inactives=${include_inactives}`;
    return this.silentHttp.get<any>(url).pipe(map(r => r.data || r), catchError(() => of([])));
  }

  getPadres(force = false): Observable<any[]> {
    if (!force && this.padresCache$.value) return of(this.padresCache$.value);
    return this.http.get<any>(`${this.baseAppManag}/modules/arbol`).pipe(map(r => r.data || r), tap(data => this.padresCache$.next(data)), catchError(() => of([])));
  }

  private invalidateCache() {
    this.getPadres(true).subscribe();
    this.reloadSidebar$.next();
  }
}