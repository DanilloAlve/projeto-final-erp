import { Perfil } from "../types/Perfil.js";

type Action = "create" | "read" | "update" | "delete";

type PermissionMap = {
  [module: string]: {
    [perfil in Perfil]?: Action[];
  };
};

export const permissions: PermissionMap = {
  usuario: {
    [Perfil.GESTOR]: ["create", "read", "update", "delete"],
  },

  financeiro: {
    [Perfil.GESTOR]: ["create", "read", "update", "delete"],
    [Perfil.SOLICITANTE]: ["read"],
  },

  pedido: {
    [Perfil.GESTOR]: ["create", "read", "update"],
    [Perfil.SOLICITANTE]: ["create", "read"],
  },

  produto: {
    [Perfil.GESTOR]: ["create", "read", "update", "delete"],
    [Perfil.SOLICITANTE]: ["read"],
  },

    movimentacao: {
    [Perfil.GESTOR]: ["create", "read", "update", "delete"],
    [Perfil.SOLICITANTE]: ["create", "read"],
  },
};