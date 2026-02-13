import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { TokenService } from '../services/token/token.service';

export const authGuard: CanActivateFn = (route, state): boolean | UrlTree => {
  const tokenService = inject(TokenService);
  const router = inject(Router);

  const accessToken = tokenService.getToken('access');

  // Si el token no existe o expiró, devolvemos un UrlTree que redirige a /login
  if (!accessToken || tokenService.isTokenExpired('access')) {
    tokenService.clearTokens();
    return router.createUrlTree(['/login']);
  }

  return true;
};