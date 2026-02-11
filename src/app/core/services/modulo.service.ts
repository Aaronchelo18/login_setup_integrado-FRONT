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
   * Obtiene los módulos. Filtra por id_persona para obtener accesos según el query maestro.
   */
  getModulos(opts?: { force?: boolean, id_persona?: number | null }): Observable<Modulo[]> {
    let params = new HttpParams();
    
    if (opts?.force) params = params.set('_', Date.now().toString());
    
    // Cambiado de id_rol a id_persona para que Laravel ejecute el INNER JOIN correcto
    if (opts?.id_persona) {
      params = params.set('id_persona', opts.id_persona.toString());
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