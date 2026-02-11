import { Component, EventEmitter, Output, CUSTOM_ELEMENTS_SCHEMA, inject, OnInit, OnDestroy, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../core/services/user.service'; // Asegúrate de que la ruta sea correcta
import { Subscription } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule]
})
export class HeaderComponent implements OnInit, OnDestroy {
  @Output() toggle = new EventEmitter<void>();

  // Propiedades para la UI
  public usuario: any = null;
  public nombreCompleto = '';
  public codigo = '';
  public panelAbierto = false;

  private userSub!: Subscription;
  private userService = inject(UserService);
  private elRef = inject(ElementRef);

  ngOnInit(): void {
    // Nos suscribimos al observable del usuario para que si cambia, el header se actualice solo
    this.userSub = this.userService.user$.subscribe(user => {
      if (user) {
        this.usuario = user;
        // Armamos el nombre según la estructura de tu captura b81759
        const nombres = user.nombres || user.person?.nombre || '';
        const paterno = user.person?.paterno || '';
        const materno = user.person?.materno || '';
        
        this.nombreCompleto = `${nombres} ${paterno} ${materno}`.trim().toUpperCase();
        this.codigo = user.codigo || '';
      }
    });
  }

  ngOnDestroy(): void {
    if (this.userSub) this.userSub.unsubscribe();
  }

  onToggleSidebar() {
    this.toggle.emit();
  }

  togglePanel(): void {
    this.panelAbierto = !this.panelAbierto;
  }

  logout(): void {
    this.userService.logout();
    // Opcional: redirección manual si tu servicio no lo hace
    // window.location.href = '/login';
  }

  // Cierra el panel si haces clic fuera de la foto o del panel
  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    const clickedInside = this.elRef.nativeElement.contains(event.target);
    if (!clickedInside && this.panelAbierto) {
      this.panelAbierto = false;
    }
  }
}