import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { UsersResponse } from '../../../models/user/users.model';

type ApiAssigned = { success: boolean; data: { id_rol: number }[] };
type ApiSave     = { success: boolean; message?: string };
type ApiList<T>  = { success: boolean; data: T[] };

@Injectable({ providedIn: 'root' })
export class UserManagementService {

  // Base para IAM: .../api/iam/role-assignment
  private iamBase = `${environment.apiUrl.code5}/api/iam/role-assignment`;
  private rolesCatalog = `${environment.apiUrl.code5}/api/iam/roles`;

  constructor(private http: HttpClient) {}

  /**
   * Lista general de usuarios (Paginada)
   */
  list(page = 1, perPage = 10): Observable<UsersResponse> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('per_page', String(perPage));
    return this.http.get<UsersResponse>(`${this.iamBase}/users`, { params });
  }

  /**
   * Búsqueda específica de usuarios por término (ID, nombre, correo)
   */
  search(term: string, page = 1, perPage = 10): Observable<UsersResponse> {
    const params = new HttpParams()
      .set('q', term)
      .set('page', String(page))
      .set('per_page', String(perPage));
    
    // Apunta a .../api/iam/role-assignment/search
    return this.http.get<UsersResponse>(`${this.iamBase}/search`, { params });
  }

  /**
   * Catálogo de todos los roles disponibles
   */
  listRoles(): Observable<ApiList<{ id_rol: number; nombre: string }>> {
    return this.http.get<ApiList<{ id_rol: number; nombre: string }>>(this.rolesCatalog);
  }

  /**
   * Roles actualmente asignados a una persona específica
   */
  assignedToUser(id_persona: number): Observable<ApiAssigned> {
    return this.http.get<ApiAssigned>(`${this.iamBase}/${id_persona}/roles`);
  }

  /**
   * Guarda/Sincroniza la lista de roles de un usuario
   */
  saveForUser(id_persona: number, roleIds: number[]): Observable<ApiSave> {
    return this.http.post<ApiSave>(`${this.iamBase}/${id_persona}/roles`, { roles: roleIds });
  }
}