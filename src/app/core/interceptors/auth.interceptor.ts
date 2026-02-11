import { inject, Injectable } from '@angular/core';
import {
  HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private router = inject(Router);

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // IMPORTANTE: Verifica que este nombre sea el mismo que usas al guardar el token en el login
    const token = localStorage.getItem('access_token') || localStorage.getItem('lamb-access-token');

    const authReq = token
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

    return next.handle(authReq).pipe(
      catchError((err: unknown) => {
        if (err instanceof HttpErrorResponse) {
          if (err.status === 401 || err.status === 403) {
            console.error('Sesión expirada o no autorizada');
            // Si falla el token, limpiamos y mandamos al login del puerto 4200
            localStorage.clear();
            window.location.href = 'http://localhost:4200/login';
          }
        }
        return throwError(() => err);
      })
    );
  }
}