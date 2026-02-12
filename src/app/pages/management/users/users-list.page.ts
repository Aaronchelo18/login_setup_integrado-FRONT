import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { UserManagementService } from '../../../core/services/management/user-management.service';
import { RolesAssignModalComponent } from '../assignroles/roles-assign-modal.component';
import { UserRow, UsersResponse } from '../../../models/user/users.model';

@Component({
  standalone: true,
  selector: 'app-users-list',
  imports: [CommonModule, FormsModule, RolesAssignModalComponent],
  templateUrl: './users-list.page.html',
  styleUrls: ['./users-list.page.css'],
})
export class UsersListPage implements OnInit, OnDestroy {
  // Estado UI
  loading = false;
  items: UserRow[] = [];

  // Búsqueda / paginación
  query = '';
  minLen = 4;
  page = 1;
  perPage = 10;
  total = 0;
  lastPage = 1;

  // Modal de asignación
  assignUser?: UserRow;

  private typing$ = new Subject<string>();
  private sub?: Subscription;

  constructor(private userSrv: UserManagementService) {}

 ngOnInit(): void {
  this.sub = this.typing$
    .pipe(debounceTime(300), distinctUntilChanged())
    .subscribe(() => {
      this.page = 1;
      this.load();
    });

  // ✅ NO cargar al iniciar porque el backend exige q>=4
  this.loading = false;
  this.items = [];
  this.total = 0;
  this.lastPage = 1;
}

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  // === Helpers ===
  get qlen(): number {
    return (this.query || '').trim().length;
  }

  fullName(u: UserRow): string {
    if (!u) return '—';
    if (u.display_name && u.display_name.trim()) return u.display_name.trim();
    const parts = [u.nombre, u.paterno, u.materno].filter(
      (x): x is string => !!x && !!x.trim()
    );
    return parts.length ? parts.join(' ') : '—';
  }

  initials(u: UserRow): string {
    const name = this.fullName(u);
    if (!name || name === '—') return '?';
    const words = name.split(/\s+/).filter(Boolean);
    return words.length >= 2
      ? (words[0][0] + words[1][0]).toUpperCase()
      : (words[0]?.[0] ?? '?').toUpperCase();
  }

  rowNumber(index: number): number {
    return (this.page - 1) * this.perPage + (index + 1);
  }

  rangeStart(): number {
    if (!this.total) return 0;
    return (this.page - 1) * this.perPage + 1;
  }

  rangeEnd(): number {
    if (!this.total) return 0;
    const end = this.page * this.perPage;
    return end > this.total ? this.total : end;
  }

  pageModel(): number[] {
    const pages = new Set<number>();
    const add = (p: number) => {
      if (p >= 1 && p <= this.lastPage) pages.add(p);
    };

    [1, 2, this.lastPage - 1, this.lastPage].forEach(add);
    [this.page - 2, this.page - 1, this.page, this.page + 1, this.page + 2].forEach(add);

    return Array.from(pages).sort((a, b) => a - b);
  }

  trackById = (_: number, r: UserRow) => r.id_persona;

  // === Carga de datos ===

  /**
   * ✅ FIX MÍNIMO:
   * - Siempre asigna items = res.data
   * - Si meta NO viene, calcula total/lastPage en base al array
   */
  private handleOk = (res: UsersResponse) => {
    const data = res?.data ?? [];
    this.items = data;

    const meta = res?.meta;

    if (meta && (meta.total !== undefined || meta.current_page !== undefined || meta.last_page !== undefined)) {
      // Backend con paginación real
      this.total = meta.total ?? data.length;
      this.page = meta.current_page ?? this.page;
      this.perPage = meta.per_page ?? this.perPage;
      this.lastPage = meta.last_page ?? 1;
    } else {
      // Backend sin meta (tu caso actual)
      this.total = data.length;
      this.lastPage = 1;

      // Si estabas en página > 1 y el backend no pagina, evita quedar "fuera"
      if (this.page !== 1) this.page = 1;
    }

    this.loading = false;
  };

  private handleErr = () => {
    this.items = [];
    this.total = 0;
    this.lastPage = 1;
    this.loading = false;
  };

  load(): void {
    this.loading = true;

    const trimmed = (this.query || '').trim();
    const doSearch = trimmed.length >= this.minLen;

    if (doSearch) {
      this.userSrv.search(trimmed, this.page, this.perPage).subscribe({
        next: this.handleOk,
        error: this.handleErr,
      });
    } else {
      this.userSrv.list(this.page, this.perPage).subscribe({
        next: this.handleOk,
        error: this.handleErr,
      });
    }
  }

  onRefreshClick() {
    this.query = '';
    this.page = 1;
    this.load();
  }

  // === Eventos UI ===
  onInput(v: string) {
    this.query = v ?? '';
    // live search si quieres:
    // this.typing$.next(this.query);
  }

  onSearchClick() {
    this.page = 1;
    this.load();
  }

  changePerPage(n: number) {
    this.perPage = +n || 10;
    this.page = 1;
    this.load();
  }

  goFirst() { if (this.page !== 1) { this.page = 1; this.load(); } }
  goPrev()  { if (this.page > 1) { this.page--; this.load(); } }
  goNext()  { if (this.page < this.lastPage) { this.page++; this.load(); } }
  goLast()  { if (this.page !== this.lastPage) { this.page = this.lastPage; this.load(); } }

  goPage(p: number) {
    if (p >= 1 && p <= this.lastPage && p !== this.page) {
      this.page = p;
      this.load();
    }
  }

  // === Modal ===
  openAssign(row: UserRow) {
    this.assignUser = row;
  }

  onAssignClosed(refresh?: boolean) {
    this.assignUser = undefined;
    if (refresh) this.load();
  }
}
