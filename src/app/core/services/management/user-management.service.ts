import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { UsersResponse } from '../../../models/user/users.model';

type ApiAssigned = { success: boolean; data: { id_rol: number }[] };
type ApiSave    = { success: boolean; message?: string; count?: number };
type ApiList<T> = { success: boolean; data: T[] };

@Injectable({ providedIn: 'root' })
export class UserManagementService {


  private usersBase = `${environment.apiUrl.code5}/api/management/users`;
  private rolesCatalog = `${environment.apiUrl.code5}/api/v1/config/roles`;
  private roleuser = `${environment.apiUrl.code5}/api/management`;


 constructor(private http: HttpClient) {}

list(page = 1, perPage?: number): Observable<UsersResponse> {
    let params = new HttpParams().set('page', String(page));
    if (perPage) params = params.set('per_page', String(perPage));
    return this.http.get<UsersResponse>(this.usersBase, { params });
  }

   search(q: string, page = 1, perPage?: number): Observable<UsersResponse> {
    let params = new HttpParams()
      .set('q', q)
      .set('page', String(page));

    if (perPage) params = params.set('per_page', String(perPage));

    // ✅ FIX #2: sin /search, tu backend es /users?q=
    return this.http.get<UsersResponse>(this.usersBase, { params });
  }


 listRoles(): Observable<ApiList<{ id_rol: number; nombre: string }>> {
    return this.http.get<ApiList<{ id_rol: number; nombre: string }>>(this.rolesCatalog);
  }

  assignedToUser(id_persona: number): Observable<ApiAssigned> {
    const url = `${this.usersBase}/${id_persona}/roles`;
    return this.http.get<ApiAssigned>(url);
  }

  saveForUser(
    id_persona: number,
    roleIds: number[]
  ): Observable<ApiSave> {
    const url = `${this.roleuser}/roles/useusersrs/${id_persona}/roles`;
    return this.http.post<ApiSave>(url, { roles: roleIds });
  }
}
