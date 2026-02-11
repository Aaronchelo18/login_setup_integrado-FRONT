import { Component, OnInit, AfterViewInit, inject, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { Modulo } from '../../models/modulo.model';
import { ModuloService } from '../../core/services/modulo.service';
import { UserService } from '../../core/services/user.service';
import { Observable } from 'rxjs';

// --- TIPOS DE VISTA PARA ICONOS ---
type ViewImg = { kind: 'img'; src: string };
type ViewMs  = { kind: 'ms'; name: string; variantClass: 'material-symbols-outlined' | 'material-symbols-rounded' | 'material-symbols-sharp' };
type ViewFa  = { kind: 'fa'; classes: string[] };
type ViewEva = { kind: 'eva'; name: string };
type ViewIfy = { kind: 'ify'; icon: string };
type ViewAny = ViewImg | ViewMs | ViewFa | ViewEva | ViewIfy;
type ModFront = Modulo & { _view: ViewAny };

// Interfaz que coincide con la respuesta de tu Backend (Laravel)
interface UserProfile {
  id_persona?: number;
  codigo: string;
  nombre: string;
  paterno: string;
  materno: string;
  nombre_completo?: string;
  correo?: string;
  foto?: string | null;
}

@Component({
  selector: 'app-setup-modulo',
  templateUrl: './setup-module.component.html',
  styleUrls: ['./setup-module.component.scss'],
})
export class SetupModuloComponent implements OnInit, AfterViewInit {
  modulos: ModFront[] = [];
  public isMenuOpen = false;
  private evaHydrated = false;
  private readonly assetsVersion = '1';

  // Inyección de dependencias
  private moduloService = inject(ModuloService);
  private userService = inject(UserService);
  private router = inject(Router);
  private cdRef = inject(ChangeDetectorRef); // Necesario para corregir error NG0100

  // Observable para el usuario (usado en el HTML con | async)
  user$: Observable<any> = this.userService.user$;

// En setup-module.component.ts
ngOnInit(): void {
  this.cleanLocalModuloCaches();
  
  // 1. Cargar módulos de inmediato
  this.loadModulos();

  // 2. Escuchar al usuario (que ahora cargará rápido desde el token)
  this.userService.user$.subscribe(user => {
    if (user) {
      this.cdRef.detectChanges();
    }
  });
}

  private loadModulos(): void {
    this.moduloService.getModulos({ force: true }).subscribe((data: Modulo[]) => {
      const raizActivos = (data ?? []).filter(
        (m) => Number(m.id_parent ?? 0) === 0 && String(m.estado) === '1'
      );

      this.modulos = raizActivos.map((mod) => {
        const img = this.resolveImageUrl(mod.imagen);
        const src = (mod as any).icono || (mod.imagen ?? '');
        const maybeIcon = img ? null : this.parseIcon(src);
        const finalView: ViewAny = img 
          ? { kind: 'img', src: img } 
          : (maybeIcon ?? { kind: 'img', src: this.defaultImg() });

        return { ...(mod as Modulo), _view: finalView };
      });
    });
  }

  // --- MÉTODOS DE APOYO ---

  toggleMenu(): void { 
    this.isMenuOpen = !this.isMenuOpen; 
  }
  
  salir(): void { 
    this.userService.logout(); 
  }

  goToAccess(modulo: Modulo): void {
    const slug = this.extractSlug(modulo.url || modulo.nombre);
    this.router.navigate(['/', slug, 'home']);
  }

  ngAfterViewInit(): void {
    const anyWin = window as any;
    if (!this.evaHydrated && anyWin?.eva?.replace) {
      anyWin.eva.replace();
      this.evaHydrated = true;
    }
  }

  // --- TYPE GUARDS PARA EL HTML ---
  isImg(v: ViewAny): v is ViewImg { return v?.kind === 'img'; }
  isMs(v: ViewAny): v is ViewMs { return v?.kind === 'ms'; }
  isFa(v: ViewAny): v is ViewFa { return v?.kind === 'fa'; }
  isEva(v: ViewAny): v is ViewEva { return v?.kind === 'eva'; }
  isIfy(v: ViewAny): v is ViewIfy { return v?.kind === 'ify'; }

  // --- HELPERS INTERNOS ---
  private extractSlug(raw?: string | null): string {
    const v = (raw ?? '').trim();
    if (!v) return '';
    const clean = v.replace(/^\/+/, '').replace(/^setup\/+/i, '');
    return clean.split('/')[0] || '';
  }

  private defaultImg(): string {
    return `assets/img/default.png?v=${this.assetsVersion}`;
  }

  private resolveImageUrl(dbValue?: string | null): string | null {
    const v = (dbValue ?? '').trim();
    if (!v || /^([a-z0-9-]+:|fa[:\s]|fa-|material-symbols:)/i.test(v)) return null;
    const looksLikeImg = /\.(png|jpe?g|webp|gif|svg)$/i.test(v);
    if (looksLikeImg) return v.startsWith('http') || v.startsWith('assets/') ? v : `assets/img/${v}`;
    return null;
  }

  private parseIcon(raw: string): ViewAny | null {
    const v = (raw ?? '').trim();
    if (!v) return null;
    if (/^material-symbols:/i.test(v)) {
      const parts = v.split(':');
      return { kind: 'ms', name: parts[parts.length - 1], variantClass: 'material-symbols-outlined' };
    }
    if (/^eva:/i.test(v)) return { kind: 'eva', name: v.split(':')[1] };
    if (/^[a-z0-9-]+:[a-z0-9-]/i.test(v)) return { kind: 'ify', icon: v };
    return null;
  }

  private cleanLocalModuloCaches(): void {
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i) || '';
        if (/modulo/i.test(key)) localStorage.removeItem(key);
      }
    } catch { }
  }
}