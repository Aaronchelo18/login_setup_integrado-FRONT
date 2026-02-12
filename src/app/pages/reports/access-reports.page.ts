import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserAccessService } from '../../core/services/management/user-access.service';
import { UserAccessReport } from '../../models/user/user.report';
import { ToastService } from '../../shared/interfaces/toast/toast.service';

@Component({
  selector: 'app-access-reports',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, FormsModule],
  templateUrl: './access-reports.page.html',
  styleUrls: ['./access-reports.page.css']
})
export class AccessReportsPage implements OnInit {
  // Data
  paginatedReports: UserAccessReport[] = [];

  // Filters
  searchTerm = '';
  selectedCampus = '';
  selectedFacultad = '';
  selectedPrograma = '';

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;
  totalRecords = 0;
  pages: number[] = [];

  // Loading
  loading = false;

  // Filter options
  campusList: Array<{id: number, nombre: string}> = [];
  facultadesList: Array<{id: number, nombre: string}> = [];
  programasList: Array<{id: number, nombre: string}> = [];

  constructor(
    private toastr: ToastService,
    private userAccessService: UserAccessService
  ) {}
  ngOnInit(): void {
    this.loadReports();
    this.loadFilterOptions();
  }

  loadReports(): void {
    this.loading = true;
    
    const idCampus = this.selectedCampus ? parseInt(this.selectedCampus) : undefined;
    const idFacultad = this.selectedFacultad ? parseInt(this.selectedFacultad) : undefined;
    const idPrograma = this.selectedPrograma ? parseInt(this.selectedPrograma) : undefined;

    this.userAccessService.getReports(
      this.currentPage,
      this.itemsPerPage,
      this.searchTerm,
      idCampus,
      idFacultad,
      idPrograma
    ).subscribe({
      next: (response) => {
        if (response.success) {
          this.paginatedReports = response.data;
          this.totalRecords = response.pagination.total;
          this.totalPages = response.pagination.last_page;
          this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading reports:', err);
        this.toastr.error('Error al cargar los reportes');
        this.loading = false;
      }
    });
  }

  loadFilterOptions(): void {
    // Cargar campus
    this.userAccessService.getCampus().subscribe({
      next: (response) => {
        if (response.success) {
          this.campusList = response.data.map((c: any) => ({
            id: c.id_campus,
            nombre: c.campus
          }));
        }
      },
      error: (err) => console.error('Error loading campus:', err)
    });

    // Cargar facultades
    this.userAccessService.getAllFacultades().subscribe({
      next: (response) => {
        if (response.success) {
          this.facultadesList = response.data.map((f: any) => ({
            id: f.id_facultad,
            nombre: f.nombre
          }));
        }
      },
      error: (err) => console.error('Error loading facultades:', err)
    });

    // Cargar programas de estudio
    this.userAccessService.getAllProgramas().subscribe({
      next: (response) => {
        if (response.success) {
          this.programasList = response.data.map((p: any) => ({
            id: p.id_programa_estudio,
            nombre: p.nombre
          }));
        }
      },
      error: (err) => console.error('Error loading programas:', err)
    });
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadReports();
  }

  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadReports();
  }

  onItemsPerPageChange(): void {
    this.currentPage = 1;
    this.loadReports();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedCampus = '';
    this.selectedFacultad = '';
    this.selectedPrograma = '';
    this.applyFilters();
    this.toastr.info('Filtros limpiados');
  }

  exportToExcel(): void {
    this.toastr.info('Función de exportación en desarrollo');
  }
} 
