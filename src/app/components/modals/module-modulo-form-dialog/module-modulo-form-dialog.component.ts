import { 
  Component, EventEmitter, Input, OnInit, Output, OnChanges, SimpleChanges, CUSTOM_ELEMENTS_SCHEMA, ChangeDetectorRef 
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModuloCreateDTO, ModuloOption, Modulo } from '../../../models/modulo.model';
import { IconPickerComponent } from '../../../icon-picker/icon-picker.component';

@Component({
  selector: 'app-module-modulo-form-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IconPickerComponent],
  templateUrl: './module-modulo-form-dialog.component.html',
  styleUrls: ['./module-modulo-form-dialog.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ModuleModuloFormDialogComponent implements OnInit, OnChanges {
  @Input() open = false;
  @Input() modules: ModuloOption[] = [];
  @Input() creating = false;
  @Input() loading = false;
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() initial: Modulo | null = null;

  @Output() close = new EventEmitter<void>();
  @Output() submit = new EventEmitter<ModuloCreateDTO>();
  @Output() onDemandParents = new EventEmitter<void>();

  form!: FormGroup;
  showIconPicker = false;
  niveles = [
    { value: 0, label: 'Nivel 0 (Módulo Raíz)' },
    { value: 1, label: 'Nivel 1 (Sub-módulo)' },
    { value: 2, label: 'Nivel 2 (Detalle)' },
  ];

  constructor(private fb: FormBuilder, private cdr: ChangeDetectorRef) {
    this.initForm();
  }

  // GETTER PARA FILTRAR PADRES SEGÚN EL NIVEL SELECCIONADO
  get filteredModules(): ModuloOption[] {
    const nivelSeleccionado = Number(this.form.get('nivel')?.value);
    
    if (nivelSeleccionado === 1) {
      // Para un Nivel 1, el padre DEBE ser Nivel 0
      return this.modules.filter(m => Number(m.nivel) === 0);
    }
    if (nivelSeleccionado === 2) {
      // Para un Nivel 2, el padre DEBE ser Nivel 1
      return this.modules.filter(m => Number(m.nivel) === 1);
    }
    return [];
  }

  ngOnInit(): void {
    this.form.get('nivel')?.valueChanges.subscribe(niv => {
      const parentCtrl = this.form.get('id_parent');
      if (Number(niv) === 0) {
        parentCtrl?.disable();
        parentCtrl?.setValue(null);
      } else {
        parentCtrl?.enable();
        // Solo resetear si el valor actual no existe en la lista filtrada
        const currentVal = parentCtrl?.value;
        const isValid = this.filteredModules.some(m => m.id_modulo === currentVal);
        if (!isValid) parentCtrl?.setValue(null);
      }
    });
  }

  private initForm() {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(120)]],
      nivel: [0, [Validators.required]],
      id_parent: [{ value: null, disabled: true }],
      url: [''],
      imagen: ['material-symbols:settings-outline'],
      estado: ['1', [Validators.required]]
    });
  }

  ngOnChanges(ch: SimpleChanges): void {
    if (this.open) {
      if (this.mode === 'edit' && this.initial) {
        this.patchFromInitial(this.initial);
        if (Number(this.initial.nivel) !== 0 && this.modules.length === 0) {
          this.onDemandParents.emit();
        }
      } else if (this.mode === 'create' && ch['open']) {
        this.form.reset({
          nombre: '', nivel: 0, id_parent: null,
          url: '', imagen: 'material-symbols:settings-outline', estado: '1'
        });
      }
    }
    this.cdr.detectChanges();
  }

  private patchFromInitial(m: Modulo): void {
    this.form.patchValue({
      nombre: m.nombre,
      nivel: Number(m.nivel),
      id_parent: m.id_parent || null,
      url: m.url,
      imagen: m.imagen || 'material-symbols:settings-outline',
      estado: String(m.estado)
    });
    
    const parentCtrl = this.form.get('id_parent');
    if (Number(m.nivel) === 0) parentCtrl?.disable(); else parentCtrl?.enable();
  }

  onFocusSelect() {
    if (this.modules.length === 0 && !this.loading) {
      this.onDemandParents.emit();
    }
  }

  // NUEVA LÓGICA DE INDICADOR DE PADRE
  formatPath(m: any): string {
    if (!m) return '';
    
    // Si es nivel 1, el padre es nivel 0 (Raíz)
    if (m.nivel === 1) {
      const parent = this.modules.find(p => p.id_modulo === m.id_parent);
      const parentName = parent ? parent.nombre : 'RAÍZ';
      return `[${parentName}] > ${m.nombre}`;
    }

    // Si es nivel 0, solo mostrar el nombre
    return m.nombre;
  }

  isImg(v: any): boolean { return /\.(png|jpg|jpeg|svg|webp)$/i.test(String(v || '')); }

  iconPreview(v: any): string {
    const s = String(v || '');
    if (this.isImg(s)) return s.startsWith('http') ? s : `assets/img/${s}`;
    return s || 'material-symbols:settings-outline';
  }

  openPicker() { this.showIconPicker = true; }
  onIconPicked(icon: string) { 
    this.form.get('imagen')?.setValue(icon); 
    this.showIconPicker = false; 
  }
  
  onCancel() { this.close.emit(); }

  onSave() {
    if (this.form.invalid) return;
    const val = this.form.getRawValue();
    this.submit.emit({
      ...val,
      id_parent: val.id_parent || 0,
      url: val.url?.trim() || null
    });
  }
}