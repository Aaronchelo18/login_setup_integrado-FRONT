import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { TokenService } from './token/token.service';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly ACCESS_KEY = 'access_token'; 
  private readonly AUTHZ_KEY = 'authz_token';

  private http = inject(HttpClient);
  private tokenService = inject(TokenService);
  private router = inject(Router);

  // URL Base: http://localhost:5017/api/auth
  private readonly AUTH_URL = `${environment.apiUrl.code5}/api/auth`;

  constructor() {}

  /** * Realiza el login manual contra Laravel
   * @param credentials debe contener { correo: string, password: string }
   */
  login(credentials: any): Observable<any> {
    return this.http.post(`${this.AUTH_URL}/login-password`, credentials);
  }

  /** Redirige al backend para iniciar flujo Google */
  loginWithGoogle(): void {
    window.location.href = `${this.AUTH_URL}/google/redirect`;
  }

  /** Procesa el string base64 y guarda los tokens sincronizando con TokenService */
  guardarTokens(authEncoded: string): void {
    try {
      // Decodificamos el JSON que viene en Base64 desde la URL o el login
      const decoded = JSON.parse(atob(authEncoded));
      
      this.saveTokens(decoded.access_token, decoded.authz_token);
      
      // Sincronizamos con el TokenService para que los Guards de Angular funcionen
      this.tokenService.guardarTokens({
        access: decoded.access_token,
        authorization: decoded.authz_token
      });
    } catch (error) {
      console.error("Error al decodificar o guardar los tokens:", error);
    }
  }

  /** Persistencia simple en LocalStorage */
  saveTokens(access: string, authz: string): void {
    localStorage.setItem(this.ACCESS_KEY, access);
    localStorage.setItem(this.AUTHZ_KEY, authz);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_KEY);
  }

  /** Decodifica el payload de un JWT (JSON Web Token) */
  decodeToken(token: string | null): any {
    if (!token) return null;
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error("Error decodificando token", e);
      return null;
    }
  }

  /** Limpia credenciales y redirige a la página de login */
  logout(): void {
    localStorage.removeItem(this.ACCESS_KEY);
    localStorage.removeItem(this.AUTHZ_KEY);
    this.tokenService.clearTokens();
    this.router.navigate(['/login']);
  }

  /** Comprueba si hay un token válido y no expirado */
  estaAutenticado(): boolean {
    const token = this.getAccessToken();
    // delegamos la lógica de expiración al TokenService
    return !!token && !this.tokenService.isTokenExpired('access');
  }
}