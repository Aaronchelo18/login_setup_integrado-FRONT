import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ReportResponse } from '../../../models/user/user.report';
import { ApiResponse, Campus, CreateUpdateAccesoDto, Facultad, FacultadComplete, ProgramaEstudio, ProgramaEstudioComplete, UsuarioPersona, UsuarioProgramaAcceso } from '../../../models/user/user-access.models';


@Injectable({
  providedIn: 'root',})

export class UserAccessService {

  private baseUrl = `${environment.apiUrl.code5}/api/management`;
  constructor(private http: HttpClient) {}

  searchUsers(term: string): Observable<ApiResponse<UsuarioPersona[]>> {
    const params = new HttpParams().set('q', term.trim());
    return this.http.get<ApiResponse<UsuarioPersona[]>>(
      `${this.baseUrl}/users`,
      { params }
    );
  }

  getUserAccesses(
    idPersona: number
  ): Observable<ApiResponse<UsuarioProgramaAcceso[]>> {
    return this.http.get<ApiResponse<UsuarioProgramaAcceso[]>>(
      `${this.baseUrl}/users/${idPersona}/accesses`
    );
  }

  createAccess(
    idPersona: number,
    dto: CreateUpdateAccesoDto
  ): Observable<ApiResponse<UsuarioProgramaAcceso>> {
    return this.http.post<ApiResponse<UsuarioProgramaAcceso>>(
      `${this.baseUrl}/users/${idPersona}/accesses`,
      dto
    );
  }

  deleteAccess(
    idPersona: number,
    accessId: number
  ): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(
      `${this.baseUrl}/users/${idPersona}/accesses/${accessId}`
    );
  }

  getCampus(): Observable<ApiResponse<Campus[]>> {
    return this.http.get<ApiResponse<Campus[]>>(
      `${this.baseUrl}/campus`
    );
  }

  getFacultades(
    idCampus: number
  ): Observable<ApiResponse<Facultad[]>> {
    const params = new HttpParams().set('id_campus', idCampus);
    return this.http.get<ApiResponse<Facultad[]>>(
      `${this.baseUrl}/facultades`,
      { params }
    );
  }

  // Obtener todas las facultades sin filtro
  getAllFacultades(): Observable<ApiResponse<FacultadComplete[]>> {
    return this.http.get<ApiResponse<FacultadComplete[]>>(
      `${this.baseUrl}/facultades`
    );
  }

  getProgramas(idFacultad: number, idCampus?: number) {
  let params = new HttpParams().set('id_facultad', idFacultad);

  if (idCampus != null) {
    params = params.set('id_campus', idCampus);
  }

  return this.http.get<ApiResponse<ProgramaEstudio[]>>(
    `${this.baseUrl}/programas-estudio`,
    { params }
  );
}


  // Obtener todos los programas sin filtro
  getAllProgramas(): Observable<ApiResponse<ProgramaEstudioComplete[]>> {
    return this.http.get<ApiResponse<ProgramaEstudioComplete[]>>(
      `${this.baseUrl}/programas-estudio`
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

    if (search) {
      params = params.set('search', search);
    }

    if (idCampus) {
      params = params.set('id_campus', idCampus.toString());
    }

    if (idFacultad) {
      params = params.set('id_facultad', idFacultad.toString());
    }

    if (idPrograma) {
      params = params.set('id_programa_estudio', idPrograma.toString());
    }

    return this.http.get<ReportResponse>(this.baseUrl + '/user-access/reports', { params });
  }
}
