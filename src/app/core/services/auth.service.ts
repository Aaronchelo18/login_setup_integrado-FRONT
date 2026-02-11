import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly ACCESS_KEY = 'access_token';
  private readonly AUTHZ_KEY = 'authz_token';

  /** Guarda los tokens en el LocalStorage del puerto 4200 */
  saveTokens(access: string, authz: string): void {
    localStorage.setItem(this.ACCESS_KEY, access);
    localStorage.setItem(this.AUTHZ_KEY, authz);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_KEY);
  }

  /** Decodifica el Payload del JWT (donde están los datos del usuario) */
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

  logout(): void {
    localStorage.clear();
    window.location.href = 'http://localhost:4201/login';
  }
}