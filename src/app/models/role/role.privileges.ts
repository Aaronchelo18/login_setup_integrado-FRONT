export interface RoleInfo {
  id_rol: number;
  nombre: string;
  estado: number; 
}

export interface ModNode {
  id_modulo: number;
  nombre: string;
  checked: boolean;
  hasPriv: boolean;          
  children?: ModNode[];
}

export interface TreeByRootResponse {
  success: boolean;
  role?: RoleInfo;
  data: ModNode[];           
  message?: string;
}
