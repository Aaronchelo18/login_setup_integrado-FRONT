import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

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
  // AJUSTADO: Ahora coincide con el prefijo 'application-management' de tu api.php
  private base =
    `${(environment as any)?.apiUrl?.code5 ?? 'http://localhost:5017'}`
      .replace(/\/+$/, '') + `/api/application-management/modules/jerarquia`;

  constructor(private http: HttpClient) {}

  /** GET /jerarquia/tree */
  getTree(opts?: { root_id?: number; include_inactives?: boolean }): Observable<ModuleNode[]> {
    let params = new HttpParams();
    if (opts?.root_id != null) params = params.set('root_id', String(opts.root_id));
    if (opts?.include_inactives != null) params = params.set('include_inactives', opts.include_inactives ? '1' : '0');
    
    return this.http
      .get<any>(`${this.base}/tree`, { params })
      .pipe(map(r => r.data || r));
  }

  /** POST /jerarquia */
  createNode(body: any): Observable<any> { 
    return this.http.post(`${this.base}`, body); 
  }

  /** PUT /jerarquia/:id */
  putNode(id: number, body: UpdateNodeDto): Observable<any> { 
    return this.http.put(`${this.base}/${id}`, body); 
  }

  /** PATCH /jerarquia/:id */
  patchNode(id: number, body: UpdateNodeDto): Observable<any> { 
    return this.http.patch(`${this.base}/${id}`, body); 
  }

  /** DELETE /jerarquia/:id */
  deleteNode(id: number): Observable<any> { 
    return this.http.delete(`${this.base}/${id}`); 
  }
}