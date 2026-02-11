import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { jwtDecode } from 'jwt-decode';

export interface UserData {
  id_persona: number | string; // <--- Nuevo campo agregado
  codigo: string;
  nombres: string;
  apellidos: string;
  id_rol: number[]; // <--- Nuevo campo agregado
  roles_ids: number[]; // <--- Nuevo campo agregado para múltiples roles
  person?: any;
  correo?: string;
  foto?: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private userSubject = new BehaviorSubject<UserData | null>(null);
  user$ = this.userSubject.asObservable();

  constructor() {
    this.loadUserFromToken();
  }

  /**
   * Extrae la información del usuario e id_rol directamente del JWT.
   */
  // src/app/core/services/user.service.ts

  private loadUserFromToken(): void {
    const token = localStorage.getItem('code5-access-token');
    if (!token) return;

    try {
      const payload: any = jwtDecode(token);
      const rolesArray = payload.roles_ids || [];

      const userData: UserData = {
        id_persona: Number(payload.sub),
        codigo: payload.codigo || '',
        // CAMBIO: Asignamos el arreglo completo directamente
        id_rol: payload.id_rol || rolesArray,
        roles_ids: rolesArray,
        nombres: payload.person?.nombre || '',
        apellidos:
          `${payload.person?.paterno || ''} ${payload.person?.materno || ''}`.trim(),
        person: payload.person,
        correo: payload.correo,
      };

      this.userSubject.next(userData);
      console.log('Usuario cargado con IDs de Roles:', userData.id_rol);
    } catch (error) {
      console.error('Error decodificando el token:', error);
    }
  }

  fetchUserProfile(): Observable<UserData | null> {
    return this.http
      .get<{
        success: boolean;
        user: UserData;
      }>(`${environment.apiUrl.global}/api/config/auth/me`)
      .pipe(
        map((res) => res.user),
        tap((user) => this.userSubject.next(user)),
        catchError((err) => {
          console.warn(
            'Backend /me falló (500), se mantienen datos del token local.',
          );
          return of(this.userSubject.value);
        }),
      );
  }

  logout() {
    localStorage.clear();
    this.userSubject.next(null);
    window.location.href = 'http://localhost:4200/login';
  }
}
