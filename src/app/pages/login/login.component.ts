import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common'; 
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { environment } from '../../../environments/environment';
import { LoaderService } from '../../loading/loader.service'; 
import { LoadingOverlayComponent } from '../../loading/loading-overlay.component';
import { Observable } from 'rxjs';

interface LoginResponse {
  success: boolean;
  message?: string;
  access_token: string;
  authz_token: string;
  expires_in: number;
  token_type: string;
}

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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.isLoading$ = this.loader.isLoading$;
    this.loaderLabel$ = this.loader.label$;

    // Escuchamos los parámetros de la URL para flujo Google
    this.route.queryParams.subscribe(params => {
      const encodedAuth = params['auth'];
      if (encodedAuth) {
        this.handleAuthAndRedirect(encodedAuth);
      }
    });
  }

  /**
   * Procesa el token y navega a la nueva ruta profesional
   */
  private handleAuthAndRedirect(encodedAuth: string): void {
    this.loader.startNavigation('Cargando módulos...');
    
    // Guardamos tokens en LocalStorage
    this.authService.guardarTokens(encodedAuth);

    // Navegación a la nueva ruta de Application Management
    this.router.navigate(['/app/application-management/setup']).then(nav => {
      if(nav) {
        console.log('Navegación exitosa al Shell profesional');
        this.loader.endNavigation();
      } else {
        console.error('Error: La ruta /app/application-management/setup no fue encontrada o el Guard la bloqueó.');
        this.loader.endNavigation();
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

    this.http.post<LoginResponse>(`${environment.apiUrl.code5}/api/config/auth/login-password`, {
      correo: this.correo,
      password: this.password
    }).subscribe({
      next: (res) => {
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
      error: (err) => {
        this.loader.endNavigation();
        this.mensaje = err.error?.message || 'Error en el servidor. Intente más tarde.';
        Swal.fire('Error', this.mensaje, 'error');
      }
    });
  }

  togglePassword(): void { 
    this.verPassword = !this.verPassword; 
  }

  mostrarSoporte(): void { 
    Swal.fire({ 
      title: 'Soporte Técnico', 
      text: 'Contacte a: soporte@upeu.edu.pe', 
      icon: 'info',
      confirmButtonColor: '#3085d6'
    }); 
  }

  loginWithGoogle(): void { 
    this.authService.loginWithGoogle(); 
  }
}