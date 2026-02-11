import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  standalone: true,
  selector: 'app-main-layout',
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.css'],
  imports: [CommonModule, RouterOutlet, HeaderComponent, SidebarComponent]
})
export class MainLayoutComponent {
  isSidebarVisible = true; // abierto por defecto

  toggleSidebar() {
    this.isSidebarVisible = !this.isSidebarVisible;
  }
}
