import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpBackend } from '@angular/common/http';
import { Observable, Subject, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Modulo, ModuloOption } from '../../models/modulo.model';

@Injectable({ providedIn: 'root' })
export class ModuloService {
  private apiRoot = `${environment?.apiUrl?.code5 ?? 'http://localhost:5017'}`.replace(/\/+$/, '') + `/api`;
  private base = `${this.apiRoot}/config/setup/modulos`;
  
  readonly reloadSidebar$ = new Subject<void>();
  private silentHttp: HttpClient;

  constructor(private http: HttpClient, handler: HttpBackend) {
    this.silentHttp = new HttpClient(handler);
  }

getModulosAdmin(): Observable<Modulo[]> {
  // Ajusta esta ruta para que coincida EXACTAMENTE con tu Route::get en Laravel
  const url = `${this.apiRoot}/modulo/admin-list`; 
  return this.http.get<any>(url).pipe(
    map(r => r.data || []),
    catchError((err) => {
      console.error("Error en listado-admin:", err); // Para debug
      return of([]);
    })
  );
}

  // REINCORPORADO PARA COMPATIBILIDAD CON OTROS COMPONENTES
  getModulos(opts?: { id_persona?: number | null, force?: boolean }): Observable<Modulo[]> {
    let params = new HttpParams();
    if (opts?.id_persona) params = params.set('id_persona', opts.id_persona.toString());
    return this.http.get<any>(this.base, { params }).pipe(
      map(r => r.data || r),
      catchError(() => of([]))
    );
  }

// Verifica si es /config/setup/modulos/opciones o solo /modulo/opciones
getOptions(include_inactives = true): Observable<ModuloOption[]> {
  return this.silentHttp.get<any>(`${this.base}/opciones?include_inactives=${include_inactives}`).pipe(
    map(r => r.data || r), 
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
    return this.http.delete(`${this.base}/${id}`).pipe(tap(() => this.reloadSidebar$.next()));
  }

  getPadres(): Observable<any[]> {
    return this.http.get<any>(`${this.base}/arbol`).pipe(map(r => r.data || r), catchError(() => of([])));
  }
}