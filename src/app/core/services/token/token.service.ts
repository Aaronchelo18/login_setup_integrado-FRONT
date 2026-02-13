import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TokenService {
   private accessKey = 'code5-access-token';
  private authorizationKey = 'code5-authorization-token';

  guardarTokens(tokens: { access: string; authorization?: string }): void {
    if (tokens.access) localStorage.setItem(this.accessKey, tokens.access);
    if (tokens.authorization) localStorage.setItem(this.authorizationKey, tokens.authorization);
  }

  getToken(tipo: 'access' | 'authorization'): string | null {
    return localStorage.getItem(tipo === 'access' ? this.accessKey : this.authorizationKey);
  }

  decodeToken(token: string | null): any | null {
    if (!token) return null;
    try {
      const payload = token.split('.')[1];
      if (!payload) return null;
      let base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4) base64 += '=';
      const json = decodeURIComponent(
        atob(base64).split('').map(c => `%${('00' + c.charCodeAt(0).toString(16)).slice(-2)}`).join('')
      );
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  isTokenExpired(tipo: 'access' | 'authorization'): boolean {
    const decoded = this.decodeToken(this.getToken(tipo));
    if (!decoded?.exp) return true;
    return decoded.exp < Math.floor(Date.now() / 1000);
  }

  clearTokens(): void {
    localStorage.removeItem(this.accessKey);
    localStorage.removeItem(this.authorizationKey);
  }

  // ===== NUEVO: helpers de roles =====

  /** Devuelve TODOS los roles que llegaron en el authz_token */
  getRoles(): string[] {
    const decoded = this.decodeToken(this.getToken('authorization'));
    const roles = decoded?.roles;
    if (Array.isArray(roles)) return roles.map((r: string) => r.toUpperCase());
    return [];
  }

  /** Decide tipo de usuario para la UI */
  getTipoUsuario(): 'admin' | 'user' {
    const roles = this.getRoles(); // p.ej. ["MASTER", "ADMIN"] o ["ALUMNO"]
    // MASTER y/o ADMIN → ver sidebar de admin; ALUMNO → sidebar de user
    return roles.includes('MASTER') || roles.includes('ADMIN') ? 'admin' : 'user';
  }
}
