import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router'; // Importamos Router
import { TokenService } from './token/token.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly ACCESS_KEY = 'access_token'; 
  private readonly AUTHZ_KEY = 'authz_token';

  private tokenService = inject(TokenService);
  private router = inject(Router); // Inyectamos router para navegación interna

  constructor() {}

  /** Redirige al backend para Google */
  loginWithGoogle(): void {
    window.location.href = 'http://localhost:5017/api/config/auth/google/redirect';
  }

  /** Procesa el string base64 y guarda los tokens */
  guardarTokens(authEncoded: string): void {
    try {
      const decoded = JSON.parse(atob(authEncoded));
      
      // Guardamos en LocalStorage con tus llaves originales
      localStorage.setItem(this.ACCESS_KEY, decoded.access_token);
      localStorage.setItem(this.AUTHZ_KEY, decoded.authz_token);
      
      // Sincronizamos con el TokenService para el Guard
      this.tokenService.guardarTokens({
        access: decoded.access_token,
        authorization: decoded.authz_token
      });
    } catch (error) {
      console.error("Error al decodificar los tokens en Setup:", error);
    }
  }

  saveTokens(access: string, authz: string): void {
    localStorage.setItem(this.ACCESS_KEY, access);
    localStorage.setItem(this.AUTHZ_KEY, authz);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_KEY);
  }

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

  /** CORREGIDO: Logout local en el puerto 4200 */
  logout(): void {
    localStorage.clear();
    this.tokenService.clearTokens();
    this.router.navigate(['/login']); // Navegación interna
  }

  estaAutenticado(): boolean {
    const token = this.getAccessToken();
    return token ? !this.tokenService.isTokenExpired('access') : false;
  }
}