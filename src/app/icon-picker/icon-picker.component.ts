import { CommonModule } from '@angular/common';
import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  EventEmitter,
  Output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

type IconHit = { icon: string };

@Component({
  selector: 'app-icon-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './icon-picker.component.html',
  styleUrls: ['./icon-picker.component.css'],
})
export class IconPickerComponent {
  @Output() pick = new EventEmitter<string>();
  @Output() close = new EventEmitter<void>();

  q = '';
  prefixes = 'eva,mdi,tabler,heroicons-outline,lucide,material-symbols';
  results: IconHit[] = [];
  loading = false;
  private t?: any;

  // Chips rápidas para el usuario
  quickChips = [
    { es: 'Ajustes', q: 'settings' },
    { es: 'Usuario', q: 'user person account' },
    { es: 'Inicio', q: 'home house' },
    { es: 'Reportes', q: 'chart analytics graph' },
    { es: 'Seguridad', q: 'lock shield key security' },
    { es: 'Archivo', q: 'file document' },
    { es: 'Dinero', q: 'money cash dollar bank' },
  ];

  // Categorías destacadas
  featured = [
    {
      title: 'Gestión / Ajustes',
      icons: ['lucide:settings', 'tabler:settings-cog', 'mdi:tune', 'eva:settings-2-outline']
    },
    {
      title: 'Usuarios',
      icons: ['lucide:user', 'tabler:users', 'mdi:account-group', 'eva:people-outline']
    },
    {
      title: 'Navegación',
      icons: ['lucide:home', 'tabler:home-2', 'mdi:home', 'eva:home-outline']
    }
  ];

  // Cargar recientes del LocalStorage
  recent: string[] = this.loadRecent();

  // === MÉTODOS DE UI ===

  onType() {
    clearTimeout(this.t);
    this.t = setTimeout(() => this.search(), 250);
  }

  applyChip(c: { es: string; q: string }) {
    this.q = c.q;
    this.search();
  }

  select(icon: string) {
    if (!icon) return;
    this.saveRecent(icon);
    this.pick.emit(icon);
    this.close.emit();
  }

  clearRecent() {
    this.recent = [];
    localStorage.removeItem('ip_recent');
  }

  // === LÓGICA DE BÚSQUEDA ===

  async search() {
    const query = this.transformQuery(this.q.trim());
    if (!query) {
      this.results = [];
      return;
    }

    const url = `https://api.iconify.design/search?query=${encodeURIComponent(query)}&prefixes=${encodeURIComponent(this.prefixes)}&limit=60`;
    
    try {
      this.loading = true;
      const res = await fetch(url);
      const data = await res.json();
      const icons: string[] = data?.icons || [];
      this.results = icons.map(i => ({ icon: i }));
    } catch (err) {
      console.error("Error buscando iconos:", err);
      this.results = [];
    } finally {
      this.loading = false;
    }
  }

  private transformQuery(q: string): string {
    const dict: Record<string, string> = {
      'ajustes': 'settings',
      'configuracion': 'settings',
      'usuario': 'user person account',
      'inicio': 'home house',
      'reporte': 'chart analytics graph',
      'seguridad': 'lock shield key security',
      'archivo': 'file document',
      'dinero': 'money bank cash'
    };
    const w = q.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    return dict[w] || q;
  }

  // === MANEJO DE RECIENTES ===

  private loadRecent(): string[] {
    try {
      const raw = localStorage.getItem('ip_recent');
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }

  private saveRecent(icon: string) {
    const set = new Set([icon, ...this.recent]);
    this.recent = Array.from(set).slice(0, 15);
    localStorage.setItem('ip_recent', JSON.stringify(this.recent));
  }
}