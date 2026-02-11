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

export interface CreateNodeDto {
  parent_id: number;
  nombre: string;
  url?: string | null;
  imagen?: string | null;
  estado?: '0' | '1';
}

export interface UpdateNodeDto {
  nombre?: string;
  url?: string | null;
  imagen?: string | null;
  estado?: '0' | '1';
  parent_id?: number;
}

@Injectable({ providedIn: 'root' })
export class ModuleHierarchyService {
  private base =
    `${(environment as any)?.apiUrl?.code5 ?? 'http://localhost:5017'}`
      .replace(/\/+$/, '') + `/api/config/setup/modulos/jerarquia`;

  constructor(private http: HttpClient) {}

  /** GET /jerarquia/tree */
  getTree(opts?: { root_id?: number; include_inactives?: boolean }): Observable<ModuleNode[]> {
    let params = new HttpParams();
    if (opts?.root_id != null) params = params.set('root_id', String(opts.root_id));
    if (opts?.include_inactives != null) params = params.set('include_inactives', String(opts.include_inactives));
    return this.http
      .get<{ success: boolean; data: ModuleNode[] }>(`${this.base}/tree`, { params })
      .pipe(map(r => r?.data ?? []));
  }

  /** POST /jerarquia */
  createNode(body: CreateNodeDto) { return this.http.post(`${this.base}`, body); }

  /** PUT /jerarquia/:id */
  putNode(id: number, body: Required<UpdateNodeDto>) { return this.http.put(`${this.base}/${id}`, body); }

  /** PATCH /jerarquia/:id */
  patchNode(id: number, body: UpdateNodeDto) { return this.http.patch(`${this.base}/${id}`, body); }

  /** DELETE /jerarquia/:id */
  deleteNode(id: number) { return this.http.delete(`${this.base}/${id}`); }
}
