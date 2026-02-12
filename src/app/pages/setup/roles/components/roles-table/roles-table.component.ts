// src/app/pages/setup/roles/components/roles-table/roles-table.component.ts
import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Role } from '../../../../../models/role/role.model';


@Component({
  selector: 'app-roles-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './roles-table.component.html',
  styleUrls: ['./roles-table.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class RolesTableComponent {
  @Input() roles: Role[] = [];
  @Input() loading = false;

  @Output() edit = new EventEmitter<Role>();
  @Output() toggle = new EventEmitter<Role>();
  @Output() remove = new EventEmitter<Role>();

  trackById = (_: number, r: Role) => r.id_rol;
}
