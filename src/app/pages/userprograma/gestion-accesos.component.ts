import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

// Importación de SweetAlert2
import Swal from 'sweetalert2';

import { Campus, CreateUpdateAccesoDto, Facultad, FacultadComplete, ProgramaEstudio, ProgramaEstudioComplete, UsuarioPersona, UsuarioProgramaAcceso } from '../../models/user/user-access.models';
import { UserAccessService } from '../../core/services/management/user-access.service';
import { ToastService } from '../../shared/interfaces/toast/toast.service';

@Component({
  selector: 'app-gestion-accesos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './gestion-accesos.component.html',
  styleUrls: ['./gestion-accesos.component.css'],
})
export class GestionAccesosComponent implements OnInit {
  searchTerm = '';
  loadingSearch = false;
  searchResults: UsuarioPersona[] = [];
  minChars = 4;
  usuarioSeleccionado: UsuarioPersona | null = null;
  accesos: UsuarioProgramaAcceso[] = [];
  loadingAccesos = false;
  showAssignModal = false;
  accesoForm!: FormGroup;
  savingAccess = false;
  campusList: Campus[] = [];
  facultadesList: Facultad[] = [];
  programasList: ProgramaEstudio[] = [];

  private allFacultades: FacultadComplete[] = [];
  private allProgramas: ProgramaEstudioComplete[] = [];
  loadingFacultades = false;
  loadingProgramas = false;

  constructor(
    private fb: FormBuilder,
    private userAccessService: UserAccessService,
    private toastr: ToastService
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.loadAllData();
  }

  private buildForm(): void {
    this.accesoForm = this.fb.group({
      id_campus: [null as number | null, Validators.required],
      id_facultad: [null as number | null, Validators.required],
      id_programa_estudio: [null as number | null, Validators.required],
    });
  }

  onSearchChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm = value.trim();
  }

  buscarUsuario(): void {
    this.usuarioSeleccionado = null;
    this.accesos = [];
    if (this.searchTerm.length < this.minChars) {
      this.searchResults = [];
      this.toastr.warning(`Ingresa al menos ${this.minChars} caracteres`);
      return;
    }
    this.loadingSearch = true;
    this.userAccessService.searchUsers(this.searchTerm).subscribe({
      next: (resp) => {
        this.searchResults = resp.success ? resp.data : [];
        this.loadingSearch = false;
        if (this.searchResults.length === 0) this.toastr.info('No se encontraron resultados');
      },
      error: () => {
        this.loadingSearch = false;
        this.searchResults = [];
        this.toastr.error('Error al buscar usuarios');
      },
    });
  }

  seleccionarUsuario(usuario: UsuarioPersona): void {
    this.usuarioSeleccionado = usuario;
    this.searchResults = [];
    this.loadAccesos(usuario.id_persona);
  }

  limpiarUsuario(): void {
    this.usuarioSeleccionado = null;
    this.accesos = [];
  }

  private loadAccesos(idPersona: number): void {
    this.loadingAccesos = true;
    this.userAccessService.getUserAccesses(idPersona).subscribe({
      next: (resp) => {
        this.accesos = resp.data ?? [];
        this.loadingAccesos = false;
      },
      error: () => {
        this.loadingAccesos = false;
        this.accesos = [];
      },
    });
  }

  /**
   * ELIMINAR ACCESO CON SWEET ALERT 2
   */
  eliminarAcceso(acceso: UsuarioProgramaAcceso): void {
    if (!this.usuarioSeleccionado) return;

    Swal.fire({
      title: '¿Eliminar acceso?',
      text: `Estás por quitar el acceso a: ${acceso.campus} - ${acceso.facultad}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.ejecutarEliminacion(acceso);
      }
    });
  }

  private ejecutarEliminacion(acceso: UsuarioProgramaAcceso): void {
    if (!this.usuarioSeleccionado) return;

    this.userAccessService.deleteAccess(this.usuarioSeleccionado.id_persona, acceso.id).subscribe({
      next: (resp) => {
        if (resp.success) {
          this.accesos = this.accesos.filter((a) => a.id !== acceso.id);
          this.toastr.success('Acceso eliminado correctamente');
          
          Swal.fire({
            title: '¡Eliminado!',
            text: 'El acceso ha sido removido con éxito.',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
          });
        }
      },
      error: () => {
        this.toastr.error('No se pudo eliminar el acceso');
        Swal.fire('Error', 'Hubo un problema al procesar la solicitud', 'error');
      }
    });
  }

  abrirModalAsignar(): void {
    if (!this.usuarioSeleccionado) return;
    this.accesoForm.reset();
    this.facultadesList = [];
    this.programasList = [];
    this.showAssignModal = true;
  }

  cerrarModal(): void {
    this.showAssignModal = false;
  }

  private loadAllData(): void {
    this.userAccessService.getCampus().subscribe({
      next: (resp) => this.campusList = resp.data ?? [],
      error: (err) => console.error('Error loading campus:', err)
    });
  }

  onChangeCampus(event: Event): void {
    const value = Number((event.target as HTMLSelectElement).value);
    this.accesoForm.patchValue({ id_campus: value || null, id_facultad: null, id_programa_estudio: null });
    this.programasList = [];
    this.facultadesList = [];
    if (!value) return;

    const cachedFacultades = this.allFacultades.filter(f => f.id_campus === value);
    if (cachedFacultades.length > 0) {
      this.facultadesList = cachedFacultades;
      return;
    }

    this.userAccessService.getFacultades(value).subscribe({
      next: (resp) => {
        const facultades = resp.data ?? [];
        this.allFacultades.push(...facultades.map(f => ({ ...f, id_campus: value })));
        this.facultadesList = facultades;
      },
      error: (err) => console.error('Error loading facultades:', err)
    });
  }

  onChangeFacultad(event: Event): void {
    const value = Number((event.target as HTMLSelectElement).value);
    this.accesoForm.patchValue({ id_facultad: value || null, id_programa_estudio: null });
    this.programasList = [];
    if (!value) return;

    const cachedProgramas = this.allProgramas.filter(p => p.id_facultad === value);
    if (cachedProgramas.length > 0) {
      this.programasList = cachedProgramas;
      return;
    }

    this.loadingProgramas = true;
    this.userAccessService.getProgramas(value).subscribe({
      next: (resp) => {
        const programas = resp.data ?? [];
        this.allProgramas.push(...programas.map(p => ({ ...p, id_facultad: value })));
        this.programasList = programas;
        this.loadingProgramas = false;
      },
      error: (err) => {
        console.error('Error loading programas:', err);
        this.toastr.error('Error al cargar programas');
        this.loadingProgramas = false;
      }
    });
  }

  guardarAcceso(): void {
    if (!this.usuarioSeleccionado) return;
    if (this.accesoForm.invalid) {
      this.accesoForm.markAllAsTouched();
      return;
    }

    const dto = this.accesoForm.value as CreateUpdateAccesoDto;
    const existeDuplicado = this.accesos.some(acc => 
      acc.id_campus === dto.id_campus && 
      acc.id_facultad === dto.id_facultad && 
      acc.id_programa_estudio === dto.id_programa_estudio
    );

    if (existeDuplicado) {
      this.toastr.warning('Este usuario ya tiene asignado este acceso');
      return;
    }

    this.savingAccess = true;
    this.userAccessService.createAccess(this.usuarioSeleccionado.id_persona, dto).subscribe({
      next: (resp) => {
        if (resp.success && resp.data) {
          this.accesos.push(resp.data);
          this.cerrarModal();
          this.toastr.success('El acceso se asignó correctamente');
        }
        this.savingAccess = false;
      },
      error: (err) => {
        this.savingAccess = false;
        this.toastr.error(err.error?.message || 'No se pudo crear el acceso');
      },
    });
  }
}