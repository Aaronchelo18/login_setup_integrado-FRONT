import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { RoleService } from '../../../../../core/services/role/role.service';

type Card = { id_modulo:number; nombre:string; checked?:boolean };

@Component({
  selector: 'app-role-apps',
  standalone: true,
  imports: [CommonModule],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './role-apps.page.html',
  styleUrls: ['./role-apps.page.css'],
})
export class RoleAppsPage implements OnInit {
  idRol!: number;
  loading = true;

  // 👇 datos del rol para el hero
  roleName = '';
  roleEstado: '0' | '1' | '' = '';

  // cards
  cards: Card[] = [];

  constructor(
    private api: RoleService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.idRol = +this.route.snapshot.paramMap.get('idRol')!;

    this.api.getRoleModulesTree(this.idRol).subscribe({
      next: (res) => {
        // 🎯 tomar el rol de la respuesta
        this.roleName = res?.role?.nombre ?? `Rol #${this.idRol}`;
        this.roleEstado = (res?.role?.estado ? '1' : '0') as '0' | '1';

        // 🎯 los roots (nivel 0) son las cards
        const roots = res?.data ?? [];
        this.cards = roots.map((r: any) => ({
          id_modulo: r.id_modulo,
          nombre: r.nombre,
          checked: !!r.checked
        }));
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  open(c: { id_modulo: number }) {
    this.router.navigate(['/setup/accesos/role', this.idRol, 'root', c.id_modulo], {
      state: { roleName: this.roleName, roleEstado: this.roleEstado }
    });
  }

  trackById(_: number, c: { id_modulo: number }) { return c.id_modulo; }

  goBack() {
    this.router.navigate(['/setup/accesos']);
  }
}
