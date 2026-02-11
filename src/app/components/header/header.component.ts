import { Component, EventEmitter, Output, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]

})
export class HeaderComponent {
  @Output() toggle = new EventEmitter<void>();

  onToggleSidebar() {
    this.toggle.emit();
  }
}

