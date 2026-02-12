type RoleInfo = { nombre?: string; estado?: number | string };

export type Node = {
  id_modulo: number;
  nombre: string;
  checked: boolean;
  children?: Node[];
  hasPriv?: boolean;
  nivel?: number;
  __parent__?: Node | null;
};

export type TreeResponse = {
  success: boolean;
  role?: RoleInfo;
  data: Node[];
};

export type SaveResponse = {
  success: boolean;
  count?: number;
  message?: string;
};