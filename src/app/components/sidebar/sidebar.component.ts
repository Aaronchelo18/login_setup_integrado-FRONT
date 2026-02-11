import { Component, Input, CUSTOM_ELEMENTS_SCHEMA, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ModuloService } from '../../core/services/modulo.service';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

type ModNode = {
  id_modulo: number;
  nombre: string;
  url?: string | null;
  imagen?: string | null;
  estado: string | number;
  children?: ModNode[];
};

@Component({
  selector: 'app-sidebar',
  standalone: true,
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
  imports: [CommonModule, RouterModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SidebarComponent implements OnInit, OnDestroy {
  @Input() collapsed = false;

  padres: ModNode[] = [];
  private open: Record<number, boolean> = {};
  private destroy$ = new Subject<void>();

  constructor(private router: Router, private moduloSrv: ModuloService) {}

  ngOnInit(): void {
    this.loadPadres();

    // refrescar sidebar cuando se cree/edite un módulo
    this.moduloSrv.reloadSidebar$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadPadres());

    // abrir solo el grupo que coincida con la URL (si aplica)
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd), takeUntil(this.destroy$))
      .subscribe(() => this.expandForCurrentUrl());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadPadres(): void {
    this.moduloSrv.getPadres().subscribe({
      next: (data: ModNode[]) => {
        this.padres = (data ?? []).filter((m) => String(m.estado) === '1');
        // Estado inicial: NINGÚN grupo abierto
        this.open = {};
        // Si la URL actual corresponde a algún grupo/página, lo abrimos
        this.expandForCurrentUrl();
      },
      error: (err) => console.error('Error cargando módulos:', err),
    });
  }

  // ==== clicks
  onParentClick(m: ModNode, ev?: MouseEvent): void {
    if (m?.children?.length) {
      // con hijos: togglear abierto/cerrado en ambos modos (expandido/colapsado)
      ev?.preventDefault();
      ev?.stopPropagation();
      this.open[m.id_modulo] = !this.open[m.id_modulo];
    }
  }
  isOpen(id: number): boolean { return !!this.open[id]; }

  // ==== helpers de slug/url
  /** Quita / iniciales y el prefijo "setup/" si viene de BD */
  private clean(u?: string | null): string {
    const v = (u || '').trim();
    if (!v) return '';
    return v.replace(/^\/+/, '').replace(/^setup\/+/i, '');
  }
  /** Devuelve el primer segmento como slug de módulo (p.ej. 'gapp' de 'setup/gapp/home') */
  private getSlug(u?: string | null): string {
    const c = this.clean(u);
    return c.split('/')[0] || '';
  }
  /** Devuelve el último segmento como página (p.ej. 'roles' de 'gapp/roles') */
  private getPage(u?: string | null): string {
    const c = this.clean(u);
    const parts = c.split('/').filter(Boolean);
    return parts[parts.length - 1] || '';
  }

  /** Link para el padre SIN hijos → '/{slug}/home' */
  normalizeUrl(url?: string | null): string | null {
    const slug = this.getSlug(url);
    return slug ? ('/' + slug + '/home') : null;
    // Excepción "setup/modulos" la tratamos solo en hijos (ver HTML)
  }

  /**
   * Link para un hijo usando SIEMPRE el módulo del PADRE:
   * '/{parentSlug}/{childPage}'
   */
  linkForChild(parent: ModNode, child: ModNode): string | null {
    const parentSlug = this.getSlug(parent?.url);
    const childPage  = this.getPage(child?.url);
    if (!parentSlug || !childPage) return null;
    return `/${parentSlug}/${childPage}`;
  }

  // ==== abrir el grupo que coincida con la URL actual (si aplica)
  private expandForCurrentUrl(): void {
    const cur = this.router.url; // ej: '/gapp/roles'
    for (const p of this.padres) {
      const pSlug = this.getSlug(p.url);
      const parentMatch = pSlug && cur.startsWith('/' + pSlug + '/');

      const childMatch = (p.children ?? []).some((c) => {
        const page = this.getPage(c.url);
        return page && cur.startsWith('/' + pSlug + '/' + page);
      });

      if (parentMatch || childMatch) {
        this.open[p.id_modulo] = true;
      }
    }
  }

  // ==== icon helpers
  iconType(icon?: string | null): 'iconify' | 'img' | 'none' {
    if (!icon) return 'none';
    const v = icon.trim().toLowerCase();
    if (v.endsWith('.png') || v.endsWith('.jpg') || v.endsWith('.jpeg') || v.endsWith('.svg')) return 'img';
    return v.includes(':') ? 'iconify' : 'none'; // ej: "material-symbols:dashboard"
  }
  iconUrl(icon?: string | null): string {
    if (!icon) return '';
    const abs = /^https?:\/\//i.test(icon);
    return abs ? icon : `assets/img/${icon}`;
  }

  // Reconoce "Módulos" con y sin tilde
  isModulosName(name?: string): boolean {
    if (!name) return false;
    const n = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    return n === 'modulos';
  }

  onChildClick(_h: any, _ev: MouseEvent) {}
}
