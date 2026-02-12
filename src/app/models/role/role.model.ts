export interface Role {
  id_rol: number;
  nombre: string;
  estado: '0' | '1';
}

export interface CreateRoleDto {
  nombre: string;
  estado: '0' | '1';
}
