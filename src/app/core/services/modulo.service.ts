import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, Subject, of, BehaviorSubject } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Modulo, ModuloOption } from '../../models/modulo.model';

@Injectable({ providedIn: 'root' })
export class ModuloService {
  private apiRoot = (environment?.apiUrl?.code5 || 'http://localhost:5017').replace(/\/+$/, '');
  private baseAppManag = `${this.apiRoot}/api/application-management`;
  private baseIam = `${this.apiRoot}/api/iam`;
  
  readonly reloadSidebar$ = new Subject<void>();
  
  // Cache para carga instantánea de la lista administrativa
  private _modulesAdmin$ = new BehaviorSubject<Modulo[]>([]);
  // Cache para el árbol de padres (usado en sidebar/selects)
  private _padresCache$ = new BehaviorSubject<any[] | null>(null);

  constructor(private http: HttpClient) {}

  /** * GETTER para los módulos en caché (Carga ultra rápida)
   */
  get modules$() {
    return this._modulesAdmin$.asObservable();
  }

  /** KPIs Dashboard (Recuperados) */
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

  /** CRUD ADMIN */
  getModulosAdmin(): Observable<Modulo[]> {
    return this.http.get<any>(`${this.baseAppManag}/modules/admin-list`).pipe(
      map(r => r.data || []),
      tap(data => this._modulesAdmin$.next(data)),
      catchError(() => {
        this._modulesAdmin$.next([]);
        return of([]);
      })
    );
  }

  create(data: any): Observable<any> {
    const url = `${this.baseAppManag}/modules/store-basic`;
    return this.http.post(url, data).pipe(
      tap(() => this.refreshAll())
    );
  }

  update(id: number, data: any): Observable<any> {
    return this.http.put(`${this.baseAppManag}/modules/${id}`, data).pipe(
      tap(() => this.refreshAll())
    );
  }

  remove(id: number): Observable<any> {
    return this.http.delete(`${this.baseAppManag}/modules/${id}`).pipe(
      tap(() => {
        // Borrado optimista en la lista local
        const current = this._modulesAdmin$.value.filter(m => m.id_modulo !== id);
        this._modulesAdmin$.next(current);
        this.refreshAll();
      })
    );
  }

  /** MÉTODOS REQUERIDOS POR SIDEBAR Y SETUP (Recuperados) */
  
  getModulos(opts?: { id_persona?: number | null, force?: boolean }): Observable<Modulo[]> {
    let params = new HttpParams();
    if (opts?.id_persona) params = params.set('id_persona', opts.id_persona.toString());
    
    return this.http.get<any>(`${this.baseAppManag}/modules`, { params }).pipe(
      map(r => r.data || r),
      catchError(() => of([]))
    );
  }

  getPadres(force = false): Observable<any[]> {
    if (!force && this._padresCache$.value) return of(this._padresCache$.value);
    
    return this.http.get<any>(`${this.baseAppManag}/modules/arbol`).pipe(
      map(r => r.data || r),
      tap(data => this._padresCache$.next(data)),
      catchError(() => of([]))
    );
  }

  getOptions(include_inactives = true): Observable<ModuloOption[]> {
    const url = `${this.baseAppManag}/modules/opciones?include_inactives=${include_inactives}`;
    return this.http.get<any>(url).pipe(
      map(r => r.data || r),
      catchError(() => of([]))
    );
  }

  /**
   * Refresca las caches en segundo plano
   */
  private refreshAll() {
    this.getModulosAdmin().subscribe();
    this.getPadres(true).subscribe();
    this.reloadSidebar$.next();
  }
}