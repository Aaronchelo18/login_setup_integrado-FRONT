import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, BehaviorSubject, tap, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ModuloService } from './modulo.service'; // Importamos el servicio principal

export interface ModuleNode {
  id_modulo: number;
  nombre: string;
  id_parent: number;
  nivel: number | string;
  url: string | null;
  estado: '0' | '1' | string;
  imagen: string | null;
  children: ModuleNode[];
}

export interface UpdateNodeDto {
  nombre?: string;
  url?: string | null;
  imagen?: string | null;
  estado?: '0' | '1';
  id_parent?: number;
}

@Injectable({ providedIn: 'root' })
export class ModuleHierarchyService {
  private base = `${(environment as any)?.apiUrl?.code5 ?? 'http://localhost:5017'}`
      .replace(/\/+$/, '') + `/api/application-management/modules/jerarquia`;

  private http = inject(HttpClient);
  private moduloSrv = inject(ModuloService); // Para notificar al sidebar

  // CACHÉ DEL ÁRBOL
  private _treeCache$ = new BehaviorSubject<ModuleNode[]>([]);
  public tree$ = this._treeCache$.asObservable();

  /** * Carga el árbol y lo guarda en el BehaviorSubject
   */
  getTree(opts?: { root_id?: number; include_inactives?: boolean }): Observable<ModuleNode[]> {
    let params = new HttpParams();
    if (opts?.root_id != null) params = params.set('root_id', String(opts.root_id));
    if (opts?.include_inactives != null) params = params.set('include_inactives', opts.include_inactives ? '1' : '0');
    
    return this.http.get<any>(`${this.base}/tree`, { params }).pipe(
      map(r => r.data || r),
      tap(nodes => this._treeCache$.next(nodes)) // Actualiza el flujo de datos
    );
  }

  patchNode(id: number, body: UpdateNodeDto): Observable<any> { 
    return this.http.patch(`${this.base}/${id}`, body).pipe(
        tap(() => this.notifyChanges())
    ); 
  }

  deleteNode(id: number): Observable<any> { 
    return this.http.delete(`${this.base}/${id}`).pipe(
        tap(() => this.notifyChanges())
    ); 
  }

  /**
   * Al haber cambios en la jerarquía, refrescamos el árbol local 
   * y le avisamos al ModuloService que el Sidebar debe recargar.
   */
  private notifyChanges() {
    // Recargar el árbol actual (sin root_id para refrescar todo o según necesites)
    this.getTree({ include_inactives: true }).subscribe();
    // Notificar al Sidebar a través del servicio principal
    this.moduloSrv.reloadSidebar$.next();
  }
}