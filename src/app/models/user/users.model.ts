export interface UserRow {
  id: number;
  id_persona: number;
  correo: string;
  nombre: string;
  paterno: string;
  materno: string;
  nombre_completo: string;

  // opcional (tu código lo usa)
  display_name?: string;
}

export interface UsersMeta {
  total?: number;
  current_page?: number;
  per_page?: number;
  last_page?: number;
}

export interface UsersResponse {
  success: boolean;
  query?: string;
  message?: string;
  data: UserRow[];

  // opcional: tu backend ahora NO lo manda, pero queda listo
  meta?: UsersMeta;
}
