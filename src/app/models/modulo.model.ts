export interface Modulo {
  id_modulo: number;
  id_parent: number;
  nombre: string;
  nivel: number;
  url: string | null;
  imagen?: string | null;
  estado: string;        // '0' | '1' si quieres ser más estricto
  icono?: string | null;
  children?: Modulo[];
}

/** DTO para crear/editar */
export interface ModuloCreateDTO {
  id_parent: number;
  nombre: string;
  nivel: number;
  url?: string | null;
  imagen?: string | null;
  estado: '0' | '1';
}

/** Para combos / opciones */
export interface ModuloOption {
  id_modulo: number;
  nombre: string;
  id_parent: number;
  nivel: number;
  estado: '0' | '1';
  path: string;
}
