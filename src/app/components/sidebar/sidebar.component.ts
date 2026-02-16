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
  open: Record<number, boolean> = {}; 
  private destroy$ = new Subject<void>();

  constructor(private router: Router, private moduloSrv: ModuloService) {}

  ngOnInit(): void {
    this.loadPadres();
    this.moduloSrv.reloadSidebar$.pipe(takeUntil(this.destroy$)).subscribe(() => this.loadPadres());
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe(() => this.expandForCurrentUrl());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadPadres(): void {
    // getPadres() ahora usa el caché que implementamos en el servicio
    this.moduloSrv.getPadres().subscribe({
      next: (data: ModNode[]) => {
        this.padres = (data ?? []).filter((m) => String(m.estado) === '1');
        this.expandForCurrentUrl();
      },
      error: (err) => console.error('Error cargando módulos:', err),
    });
  }

  onParentClick(m: ModNode, ev?: MouseEvent): void {
    if (m?.children?.length) {
      ev?.preventDefault();
      ev?.stopPropagation();
      this.open[m.id_modulo] = !this.open[m.id_modulo];
    }
  }

  isOpen(id: number): boolean { return !!this.open[id]; }

  private clean(u?: string | null): string {
    if (!u) return '';
    return u.trim().replace(/^\/+/, '').replace(/\/+$/, '');
  }

  normalizeUrl(url?: string | null): string | null {
    const raw = this.clean(url).toLowerCase();
    if (!raw) return null;

    if (raw.includes('dashboard')) return '/app/application-management/dashboard';
    if (raw.includes('iam/roles')) return '/app/iam/roles';
    if (raw.includes('iam/user-access')) return '/app/iam/user-access';
    if (raw.includes('iam/role-assignment')) return '/app/iam/role-assignment';
    if (raw.includes('application-management/modules')) return '/app/application-management/modules';
    
    // Eliminada la redirección de access-control
    
    if (raw.startsWith('app/')) return '/' + raw;
    return '/app/' + raw;
  }

  linkForChild(parent: ModNode, child: ModNode): string | null {
    return this.normalizeUrl(child?.url);
  }

  private expandForCurrentUrl(): void {
    const cur = this.router.url;
    for (const p of this.padres) {
      const pUrl = this.normalizeUrl(p.url) || '';
      const childMatch = (p.children ?? []).some((c) => {
        const cUrl = this.linkForChild(p, c) || '';
        return cUrl ? cur.startsWith(cUrl) : false;
      });
      if (childMatch || (pUrl && cur.startsWith(pUrl))) {
        this.open[p.id_modulo] = true;
      }
    }
  }

  iconType(icon?: string | null): 'iconify' | 'img' | 'none' {
    if (!icon) return 'none';
    const v = icon.trim().toLowerCase();
    if (v.endsWith('.png') || v.endsWith('.jpg') || v.endsWith('.svg') || v.endsWith('.webp')) return 'img';
    return v.includes(':') ? 'iconify' : 'none';
  }

  iconUrl(icon?: string | null): string {
    if (!icon) return '';
    if (/^https?:\/\//i.test(icon)) return icon;
    return `assets/img/${icon}`;
  }

  private normalizeString(n: string): string {
    return n.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  }

  isModulosName(name?: string): boolean {
    const n = this.normalizeString(name || '');
    return n === 'modulos' || n.includes('gestion de modulos');
  }

  isRolesName(name?: string): boolean {
    const n = this.normalizeString(name || '');
    return n === 'roles' || n === 'gestion de roles';
  }

  isAssignmentName(name?: string): boolean {
    const n = this.normalizeString(name || '');
    return n.includes('asignacion de roles');
  }

  isUserAccessName(name?: string): boolean {
    const n = this.normalizeString(name || '');
    return n.includes('accesos a usuarios');
  }

  // Desactivado para que no devuelva true y no genere el link en el HTML
  isAccessControlName(name?: string): boolean {
    return false; 
  }

  isDashboardName(name?: string): boolean {
    const n = this.normalizeString(name || '');
    return n === 'dashboard' || n === 'inicio';
  }

  onChildClick(h: any, ev: MouseEvent): void {}
}