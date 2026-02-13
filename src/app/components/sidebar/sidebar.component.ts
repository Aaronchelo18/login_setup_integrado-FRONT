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
    const v = (u || '').trim();
    return v ? v.replace(/^\/+/, '').replace(/^setup\/+/i, '') : '';
  }

  private getSlug(u?: string | null): string { return this.clean(u).split('/')[0] || ''; }

  private getPage(u?: string | null): string {
    const parts = this.clean(u).split('/').filter(Boolean);
    return parts[parts.length - 1] || '';
  }

  normalizeUrl(url?: string | null): string | null {
    const slug = this.getSlug(url);
    return slug ? ('/' + slug + '/home') : null;
  }

  linkForChild(parent: ModNode, child: ModNode): string | null {
    const rawUrl = (child?.url || '').trim().replace(/^\/+/, '').replace(/\/+$/, '');
    if (rawUrl) return '/' + rawUrl;
    const parentSlug = this.getSlug(parent?.url);
    const childPage = this.getPage(child?.url);
    return (parentSlug && childPage) ? `/${parentSlug}/${childPage}` : null;
  }

  private expandForCurrentUrl(): void {
    const cur = this.router.url;
    for (const p of this.padres) {
      const pSlug = this.getSlug(p.url);
      const childMatch = (p.children ?? []).some((c) => {
        const rawUrl = (c.url || '').trim().replace(/^\/+/, '').replace(/\/+$/, '');
        return rawUrl ? (cur === '/' + rawUrl || cur.startsWith('/' + rawUrl + '/')) : false;
      });
      if (childMatch || (pSlug && cur.startsWith('/' + pSlug + '/'))) {
        this.open[p.id_modulo] = true;
      }
    }
  }

  iconType(icon?: string | null): 'iconify' | 'img' | 'none' {
    if (!icon) return 'none';
    const v = icon.trim().toLowerCase();
    if (v.endsWith('.png') || v.endsWith('.jpg') || v.endsWith('.svg')) return 'img';
    return v.includes(':') ? 'iconify' : 'none';
  }

  iconUrl(icon?: string | null): string {
    return icon ? (/^https?:\/\//i.test(icon) ? icon : `assets/img/${icon}`) : '';
  }

  isModulosName(name?: string): boolean {
    return !!name && name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim() === 'modulos';
  }

  onChildClick(_h: any, _ev: MouseEvent) {}
}