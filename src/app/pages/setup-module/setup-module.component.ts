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

@Component({
  selector: 'app-setup-modulo',
  templateUrl: './setup-module.component.html',
  styleUrls: ['./setup-module.component.scss'],
})
export class SetupModuloComponent implements OnInit, AfterViewInit {
  // --- PROPIEDADES PÚBLICAS ---
  public modulos: ModFront[] = [];
  public isMenuOpen = false;
  public loadingModulos = true;
  public errorMessage: string | null = null;
  public user$: Observable<any>;

  // --- PROPIEDADES PRIVADAS ---
  private evaHydrated = false;
  private readonly assetsVersion = '1';

  // --- INYECCIÓN DE SERVICIOS ---
  private moduloService = inject(ModuloService);
  private userService = inject(UserService);
  private router = inject(Router);
  private cdRef = inject(ChangeDetectorRef);

  constructor() {
    this.user$ = this.userService.user$;
  }

  ngOnInit(): void {
    this.cleanLocalModuloCaches();
    this.initUserSubscription();
  }

  private initUserSubscription(): void {
    this.userService.user$.subscribe({
      next: (user) => {
        if (user) {
          const targetId = user.id_persona || user.codigo;
          if (targetId) {
            this.loadModulos(targetId);
          } else {
            this.handleLoadError("No se encontró un identificador de usuario válido.");
          }
        }
      },
      error: (err) => this.handleLoadError("Error al obtener datos de sesión.")
    });
  }

  private loadModulos(idPersona: number | string): void {
    this.loadingModulos = true;
    this.errorMessage = null;

    this.moduloService.getModulos({ force: true, id_persona: Number(idPersona) }).subscribe({
      next: (data: Modulo[]) => {
        const raizActivos = (data ?? []).filter(
          (m) => Number(m.id_parent ?? 0) === 0 && String(m.estado) === '1'
        );

        this.modulos = raizActivos.map((mod) => this.transformToModFront(mod));
        this.loadingModulos = false;
        this.cdRef.detectChanges();
      },
      error: (err) => {
        console.error('Error en loadModulos:', err);
        this.handleLoadError("Error al cargar los módulos de acceso.");
      }
    });
  }

  private transformToModFront(mod: Modulo): ModFront {
    const img = this.resolveImageUrl(mod.imagen);
    const displayNombre = (mod as any).modulo_nombre || mod.nombre;
    const src = (mod as any).icono || (mod.imagen ?? '');
    const maybeIcon = img ? null : this.parseIcon(src);
    
    const finalView: ViewAny = img 
      ? { kind: 'img', src: img } 
      : (maybeIcon ?? { kind: 'img', src: this.defaultImg() });

    return { ...mod, nombre: displayNombre, _view: finalView } as ModFront;
  }

  private handleLoadError(msg: string): void {
    this.loadingModulos = false;
    this.errorMessage = msg;
    this.cdRef.detectChanges();
  }

  // --- NAVEGACIÓN Y UI ---

  toggleMenu(): void { this.isMenuOpen = !this.isMenuOpen; }

  salir(): void { this.userService.logout(); }

  /**
   * NAVEGACIÓN CORREGIDA: Redirige según la tabla de rutas propuesta
   */
  goToAccess(modulo: Modulo): void {
    const rawUrl = (modulo.url || '').toLowerCase();
    const nombre = (modulo.nombre || '').toLowerCase();

    // 1. Gestión de Aplicaciones / Dashboard (Items #1 y #14)
    if (rawUrl.includes('gapp') || nombre.includes('aplicaciones')) {
      this.router.navigate(['/app/application-management/dashboard']);
      return;
    }

    // 2. Prácticas Preprofesionales (Item #2)
    if (rawUrl.includes('ppp') || nombre.includes('prácticas')) {
      this.router.navigate(['/app/internships/setup']);
      return;
    }

    // 3. Vinculación con el Medio (Item #11)
    if (rawUrl.includes('vcm') || nombre.includes('vinculación')) {
      this.router.navigate(['/app/community-engagement/setup']);
      return;
    }

    // 4. Gestión de Inventarios (Item #15)
    if (rawUrl.includes('gestion') || nombre.includes('inventarios')) {
      this.router.navigate(['/app/inventory-management']);
      return;
    }

    // 5. Fallback para otros módulos (Usa el Shell con prefijo /app/)
    const slug = this.extractSlug(modulo.url || modulo.nombre);
    this.router.navigate(['/app', slug]);
  }

  ngAfterViewInit(): void {
    this.refreshEvaIcons();
  }

  private refreshEvaIcons(): void {
    const anyWin = window as any;
    if (anyWin?.eva?.replace) {
      anyWin.eva.replace();
      this.evaHydrated = true;
    }
  }

  isImg(v: ViewAny): v is ViewImg { return v?.kind === 'img'; }
  isMs(v: ViewAny): v is ViewMs { return v?.kind === 'ms'; }
  isFa(v: ViewAny): v is ViewFa { return v?.kind === 'fa'; }
  isEva(v: ViewAny): v is ViewEva { return v?.kind === 'eva'; }
  isIfy(v: ViewAny): v is ViewIfy { return v?.kind === 'ify'; }

  private extractSlug(raw?: string | null): string {
    let v = (raw ?? '').trim().toLowerCase();
    if (!v) return '';
    // Limpia prefijos antiguos para generar el slug dinámico
    v = v.replace(/^setup\//, '').replace(/^gapp\//, '').replace(/^\//, '');
    return v.split('/')[0] || '';
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