export interface ModuleNode {
  id_modulo: number;
  id_parent: number | null;
  nombre: string;
  nivel: number;           
  asignado: boolean | 0 | 1 
  children?: ModuleNode[];
  expanded?: boolean;
}

export interface PrivilegeItem {
  id_privilegio: number;
  nombre: string;
  descripcion?: string | null;
  checked?: boolean;
}
