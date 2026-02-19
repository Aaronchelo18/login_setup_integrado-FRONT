import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserManagementService } from '../../../core/services/management/user-management.service';
import { RolesAssignModalComponent } from '../assignroles/roles-assign-modal.component';
import { UserRow, UsersResponse } from '../../../models/user/users.model';

@Component({
  standalone: true,
  selector: 'app-users-list',
  imports: [CommonModule, FormsModule, RolesAssignModalComponent],
  templateUrl: './users-list.page.html',
  styleUrls: ['./users-list.page.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class UsersListPage implements OnInit, OnDestroy {
  loading = false;
  items: UserRow[] = [];
  query = '';
  minLen = 1; 
  page = 1;
  perPage = 10;
  total = 0;
  lastPage = 1;
  assignUser?: UserRow;

  private userSrv = inject(UserManagementService);
  private router = inject(Router);

  // Getter para el HTML
  get qlen(): number {
    return (this.query || '').trim().length;
  }

  ngOnInit(): void {
    this.load();
  }

  ngOnDestroy(): void {}

  /**
   * Navegación al dashboard
   */
  goBack(): void {
    this.router.navigate(['/app/application-management/dashboard']);
  }

  load(): void {
    const trimmed = (this.query || '').trim();
    if (trimmed.length > 0 && trimmed.length < this.minLen) return;

    this.loading = true;
    const obs = trimmed.length >= this.minLen
      ? this.userSrv.search(trimmed, this.page, this.perPage)
      : this.userSrv.list(this.page, this.perPage);

    obs.subscribe({
      next: (res) => {
        this.items = res?.data ?? [];
        if (res?.meta) {
          this.total = res.meta.total ?? this.items.length;
          this.page = res.meta.current_page ?? this.page;
          this.lastPage = res.meta.last_page ?? 1;
        } else {
          this.total = this.items.length;
          this.lastPage = 1;
        }
        this.loading = false;
      },
      error: () => {
        this.items = [];
        this.total = 0;
        this.loading = false;
      }
    });
  }

  onInput(v: string) {
    this.query = v ?? '';
  }

  onSearchClick() {
    this.page = 1;
    this.load();
  }

  fullName(u: UserRow): string {
    if (!u) return '—';
    const parts = [u.nombre, u.paterno, u.materno].filter(x => !!x?.trim());
    return parts.length ? parts.join(' ') : '—';
  }

  /**
   * Genera iniciales (Corregido el error de variable SurName)
   */
  initials(u: UserRow): string {
    const name = u.nombre || '';
    const surname = u.paterno || '';
    const i1 = name[0] || '?';
    const i2 = surname[0] || '';
    return (i1 + i2).toUpperCase();
  }

  goPrev() { 
    if (this.page > 1) { 
      this.page--; 
      this.load(); 
    } 
  }

  goNext() { 
    if (this.page < this.lastPage) { 
      this.page++; 
      this.load(); 
    } 
  }
  
  trackById = (_: number, r: UserRow) => r.id_persona;

  openAssign(row: UserRow) { 
    this.assignUser = row; 
  }

  onAssignClosed(refresh?: boolean) {
    this.assignUser = undefined;
    if (refresh) this.load();
  }
}