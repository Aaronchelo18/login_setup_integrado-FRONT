import {
  Component, EventEmitter, Input, Output,
  AfterViewInit, OnChanges, SimpleChanges,
  ElementRef, ViewChild, CUSTOM_ELEMENTS_SCHEMA
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-role-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './role-form-modal.component.html',
  styleUrls: ['./role-form-modal.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class RoleFormModalComponent implements AfterViewInit, OnChanges {
  @Input() visible = false;
  @Input() saving = false;
  @Input() canMutate = true;
  @Input() hideEstado = false;
  @Input() editing = false;

  @Input() serverError: string = '';
  @Input() serverFieldErrors: Record<string, string> = {};

  @Output() close = new EventEmitter<void>();
  @Output() submit = new EventEmitter<{ nombre: string; estado: boolean }>();

  // ⛳️ Declarar sin inicializar aquí
  form!: FormGroup;

  @ViewChild('first') first!: ElementRef<HTMLInputElement>;

  constructor(private fb: FormBuilder) {
    // ✅ Inicializar aquí (ya existe fb)
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(64)]],
      estado: [true],
    });
  }

  ngAfterViewInit() {
    if (this.visible) {
      setTimeout(() => this.first?.nativeElement?.focus(), 0);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']?.currentValue === true) {
      // auto-reset al abrir
      this.reset({ nombre: '', estado: true });
      setTimeout(() => this.first?.nativeElement?.focus(), 0);
    }
  }

  /** Método público para resetear desde el contenedor */
  reset(initial?: Partial<{ nombre: string; estado: boolean }>) {
    this.form.reset({ nombre: '', estado: true, ...(initial ?? {}) });
    this.form.markAsPristine();
    this.form.markAsUntouched();
  }

  onBackdrop(e: MouseEvent) {
    if (e.target === e.currentTarget && !this.saving) this.close.emit();
  }

  onEsc() {
    if (!this.saving) this.close.emit();
  }

  save() {
    if (this.saving) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.value;
    this.submit.emit({ nombre: v['nombre']!, estado: !!v['estado'] });
  }
}
