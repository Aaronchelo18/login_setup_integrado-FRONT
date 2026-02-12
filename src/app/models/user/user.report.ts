export interface UserAccessReport {
  id: number;
  id_persona: number;
  nombre_completo: string;
  correo: string;
  campus: string;
  facultad: string;
  programa_estudio: string;
  fecha_asignacion: string;
}

export interface ReportResponse {
  success: boolean;
  data: UserAccessReport[];
  pagination: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
  };
}