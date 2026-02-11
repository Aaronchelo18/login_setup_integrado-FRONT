import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpBackend } from '@angular/common/http';
import { Observable, Subject, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Modulo, ModuloOption } from '../../models/modulo.model';

@Injectable({ providedIn: 'root' })
export class ModuloService {
  private base = `${environment?.apiUrl?.code5 ?? 'http://localhost:5017'}`.replace(/\/+$/, '') + `/api/config/setup/modulos`;
  readonly reloadSidebar$ = new Subject<void>();
  
  private silentHttp: HttpClient;

  constructor(private http: HttpClient, handler: HttpBackend) {
    this.silentHttp = new HttpClient(handler);
  }

  /**
   * Obtiene los módulos. Si se pasa id_rol, el backend filtrará por permisos.
   */
  getModulos(opts?: { force?: boolean, id_rol?: number | null }): Observable<Modulo[]> {
    let params = new HttpParams();
    if (opts?.force) params = params.set('_', Date.now().toString());
    
    // Enviamos el id_rol si existe para filtrar por permisos
    if (opts?.id_rol) {
      params = params.set('id_rol', opts.id_rol.toString());
    }

    return this.http.get<any>(this.base, { params }).pipe(
      map(r => r.data || r),
      catchError(() => of([]))
    );
  }

  getAll(): Observable<Modulo[]> {
    return this.getModulos();
  }

  getOptions(include_inactives = true): Observable<ModuloOption[]> {
    return this.silentHttp.get<any>(`${this.base}/opciones?include_inactives=${include_inactives}`).pipe(
      map(r => r.data || r),
      catchError(() => of([]))
    );
  }

  getPadres(): Observable<Modulo[]> {
    return this.silentHttp.get<any>(`${this.base}/arbol?include_inactives=false`).pipe(
      map(r => {
        const data = r.data || r;
        return data.filter((m: any) => String(m.estado) === '1');
      }),
      catchError(() => of([]))
    );
  }

  create(data: any): Observable<any> {
    return this.http.post(this.base, data).pipe(tap(() => this.reloadSidebar$.next()));
  }

  update(id: number, data: any): Observable<any> {
    return this.http.put(`${this.base}/${id}`, data).pipe(tap(() => this.reloadSidebar$.next()));
  }

  remove(id: number): Observable<any> {
    return this.http.delete(`${this.base}/${id}`);
  }
}