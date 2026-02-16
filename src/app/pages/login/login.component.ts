import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CommonModule } from '@angular/common'; 
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { LoaderService } from '../../loading/loader.service'; 
import { LoadingOverlayComponent } from '../../loading/loading-overlay.component';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LoadingOverlayComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  correo = '';
  password = '';
  verPassword = false;
  mensaje = '';

  isLoading$!: Observable<boolean>;
  loaderLabel$!: Observable<string>;

  private readonly loader = inject(LoaderService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  constructor() {}

  ngOnInit(): void {
    this.isLoading$ = this.loader.isLoading$;
    this.loaderLabel$ = this.loader.label$;

    this.route.queryParams.subscribe(params => {
      const encodedAuth = params['auth'];
      if (encodedAuth) {
        this.handleAuthAndRedirect(encodedAuth);
      }
    });
  }

  private handleAuthAndRedirect(encodedAuth: string): void {
    this.loader.startNavigation('Cargando módulos...');
    this.authService.guardarTokens(encodedAuth);

    // REDIRECCIÓN CORRECTA AL SETUP
    this.router.navigate(['/app/application-management/setup']).then(nav => {
      if(nav) {
        this.loader.endNavigation();
      } else {
        console.error('Error: La ruta /app/application-management/setup no existe o está bloqueada.');
        this.loader.endNavigation();
        this.mensaje = 'Error al redirigir al setup.';
      }
    });
  }

  loginManual(): void {
    if (!this.correo || !this.password) {
      this.mensaje = 'Ingresa tu usuario y contraseña.';
      return;
    }

    this.mensaje = '';
    this.loader.startNavigation('Validando credenciales...');

    this.authService.login({
      correo: this.correo,
      password: this.password
    }).subscribe({
      next: (res: any) => {
        if (res.success) {
          const payload = {
            access_token: res.access_token,
            authz_token:  res.authz_token,
            expires_in:   res.expires_in,
            token_type:   res.token_type
          };
          const encoded = btoa(JSON.stringify(payload));
          this.handleAuthAndRedirect(encoded);
        } else {
          this.loader.endNavigation();
          this.mensaje = res.message || 'Credenciales incorrectas.';
        }
      },
      error: (err: any) => { // Tipado (err: any) para evitar error TS
        this.loader.endNavigation();
        this.mensaje = err.error?.message || 'Error en el servidor.';
        Swal.fire('Error de Acceso', this.mensaje, 'error');
      }
    });
  }

  togglePassword(): void { this.verPassword = !this.verPassword; }
  
  mostrarSoporte(): void { 
    Swal.fire({ 
      title: 'Soporte Técnico', 
      text: 'Contacte a: soporte@upeu.edu.pe', 
      icon: 'info',
      confirmButtonColor: '#3085d6'
    }); 
  }

  loginWithGoogle(): void { this.authService.loginWithGoogle(); }
}