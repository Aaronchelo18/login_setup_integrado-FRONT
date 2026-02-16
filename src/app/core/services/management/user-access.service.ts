import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ReportResponse } from '../../../models/user/user.report';
import { ApiResponse, Campus, CreateUpdateAccesoDto, Facultad, FacultadComplete, ProgramaEstudio, ProgramaEstudioComplete, UsuarioPersona, UsuarioProgramaAcceso } from '../../../models/user/user-access.models';

@Injectable({
  providedIn: 'root',
})
export class UserAccessService {
  // Sincronizado con api.php
  private baseIam = `${environment.apiUrl.code5}/api/iam`;
  private baseApp = `${environment.apiUrl.code5}/api/application-management`;

  constructor(private http: HttpClient) {}

  searchUsers(term: string): Observable<ApiResponse<UsuarioPersona[]>> {
    const params = new HttpParams().set('q', term.trim());
    return this.http.get<ApiResponse<UsuarioPersona[]>>(
      `${this.baseIam}/user-access/search`,
      { params }
    );
  }

  getUserAccesses(idPersona: number): Observable<ApiResponse<UsuarioProgramaAcceso[]>> {
    return this.http.get<ApiResponse<UsuarioProgramaAcceso[]>>(
      `${this.baseIam}/user-access/${idPersona}/list`
    );
  }

  createAccess(idPersona: number, dto: CreateUpdateAccesoDto): Observable<ApiResponse<UsuarioProgramaAcceso>> {
    return this.http.post<ApiResponse<UsuarioProgramaAcceso>>(
      `${this.baseIam}/user-access/${idPersona}/save`,
      dto
    );
  }

  deleteAccess(idPersona: number, accessId: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(
      `${this.baseIam}/user-access/${idPersona}/delete/${accessId}`
    );
  }

  getCampus(): Observable<ApiResponse<Campus[]>> {
    return this.http.get<ApiResponse<Campus[]>>(
      `${this.baseApp}/campus`
    );
  }

  getFacultades(idCampus: number): Observable<ApiResponse<Facultad[]>> {
    const params = new HttpParams().set('id_campus', idCampus);
    return this.http.get<ApiResponse<Facultad[]>>(
      `${this.baseApp}/facultades`,
      { params }
    );
  }

  getAllFacultades(): Observable<ApiResponse<FacultadComplete[]>> {
    return this.http.get<ApiResponse<FacultadComplete[]>>(
      `${this.baseApp}/facultades`
    );
  }

  getProgramas(idFacultad: number, idCampus?: number): Observable<ApiResponse<ProgramaEstudio[]>> {
    let params = new HttpParams().set('id_facultad', idFacultad);
    if (idCampus != null) {
      params = params.set('id_campus', idCampus);
    }
    return this.http.get<ApiResponse<ProgramaEstudio[]>>(
      `${this.baseApp}/programas`,
      { params }
    );
  }

  getAllProgramas(): Observable<ApiResponse<ProgramaEstudioComplete[]>> {
    return this.http.get<ApiResponse<ProgramaEstudioComplete[]>>(
      `${this.baseApp}/programas`
    );
  }

  getReports(
    page: number = 1,
    perPage: number = 10,
    search: string = '',
    idCampus?: number,
    idFacultad?: number,
    idPrograma?: number
  ): Observable<ReportResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());

    if (search) params = params.set('search', search);
    if (idCampus) params = params.set('id_campus', idCampus.toString());
    if (idFacultad) params = params.set('id_facultad', idFacultad.toString());
    if (idPrograma) params = params.set('id_programa_estudio', idPrograma.toString());

    return this.http.get<ReportResponse>(`${this.baseIam}/user-access/reports`, { params });
  }
}