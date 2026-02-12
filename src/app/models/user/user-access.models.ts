export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  query?: string;
  data: T;
}

export interface UsuarioPersona {
  id: number;
  id_persona: number;
  correo: string;
  nombre: string;
  paterno: string;
  materno: string;
  nombre_completo: string;
}

export interface UsuarioProgramaAcceso {
  id: number;
  id_usuario: number;
  id_campus: number;
  campus: string;
  id_facultad: number;
  facultad: string;
  id_programa_estudio: number;
  programa_estudio: string;
}

export interface CreateUpdateAccesoDto {
  id_campus: number;
  id_facultad: number;
  id_programa_estudio: number;
}

export interface Campus {
  id_campus: number;
  campus: string;
}

export interface Facultad {
  id_facultad: number;
  nombre: string;
}

export interface FacultadComplete extends Facultad {
  id_campus: number;
}

export interface ProgramaEstudio {
  id_programa_estudio: number;
  nombre: string;
}

export interface ProgramaEstudioComplete extends ProgramaEstudio {
  id_facultad: number;
}
