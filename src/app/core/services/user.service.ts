import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { jwtDecode } from 'jwt-decode';

export interface UserData {
  id_persona: number | string;
  codigo: string;
  nombres: string;
  apellidos: string;
  id_rol: number[];
  roles_ids: number[];
  person?: any;
  correo?: string;
  foto?: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private userSubject = new BehaviorSubject<UserData | null>(null);
  user$ = this.userSubject.asObservable();

  // URL corregida sin el /config
  private readonly AUTH_ME_URL = `${environment.apiUrl.code5}/api/auth/me`;

  constructor() {
    this.loadUserFromToken();
  }

  /**
   * Carga inicial desde el token guardado en localStorage
   */
  private loadUserFromToken(): void {
    // CORRECCIÓN: Usar 'access_token'
    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
      const payload: any = jwtDecode(token);
      const rolesArray = payload.roles_ids || [];

      const userData: UserData = {
        id_persona: Number(payload.sub),
        codigo: payload.codigo || '',
        id_rol: payload.id_rol || rolesArray,
        roles_ids: rolesArray,
        nombres: payload.person?.nombre || '',
        apellidos: `${payload.person?.paterno || ''} ${payload.person?.materno || ''}`.trim(),
        person: payload.person,
        correo: payload.correo,
      };

      this.userSubject.next(userData);
      console.log('User cargado desde token:', userData);
    } catch (error) {
      console.error('Error decodificando el token:', error);
    }
  }

  /**
   * Llama al endpoint /me del backend para refrescar datos
   */
  fetchUserProfile(): Observable<UserData | null> {
    return this.http
      .get<{
        success: boolean;
        user: UserData;
      }>(this.AUTH_ME_URL)
      .pipe(
        map((res) => res.user),
        tap((user) => this.userSubject.next(user)),
        catchError((err) => {
          console.warn('Backend /me no respondió adecuadamente, usando datos locales.');
          return of(this.userSubject.value);
        }),
      );
  }

  logout() {
    localStorage.clear();
    this.userSubject.next(null);
    window.location.href = '/login';
  }
}