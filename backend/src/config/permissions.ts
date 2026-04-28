import { Perfil } from "../types/Perfil.js";

type Action = "create" | "read" | "update" | "delete";

/** Permissões por módulo; chaves sempre `Perfil` alinhadas ao frontend (`profiles.ts`). */
type PermissionMap = {
  [module: string]: Partial<Record<Perfil, Action[]>>;
};

export const permissions: PermissionMap = {
  usuario: {
    [Perfil.ADMINISTRADOR_SISTEMA]: ["create", "read", "update", "delete"],
    [Perfil.GERENTE_SUPERVISOR]: ["create", "read", "update", "delete"],
  },

  financeiro: {
    [Perfil.ADMINISTRADOR_SISTEMA]: ["create", "read", "update", "delete"],
    [Perfil.GERENTE_SUPERVISOR]: ["create", "read", "update", "delete"],
    [Perfil.FINANCEIRO_CONTADOR]: ["create", "read", "update", "delete"],
    [Perfil.OPERADOR_ESTOQUE]: ["read"],
    [Perfil.APENAS_VISUALIZACAO]: ["read"],
  },

  pedido: {
    [Perfil.ADMINISTRADOR_SISTEMA]: ["create", "read", "update", "delete"],
    [Perfil.GERENTE_SUPERVISOR]: ["create", "read", "update"],
    [Perfil.FINANCEIRO_CONTADOR]: ["create", "read", "update"],
    [Perfil.OPERADOR_ESTOQUE]: ["read"],
    [Perfil.APENAS_VISUALIZACAO]: ["read"],
  },

  produto: {
    [Perfil.ADMINISTRADOR_SISTEMA]: ["create", "read", "update", "delete"],
    [Perfil.GERENTE_SUPERVISOR]: ["create", "read", "update", "delete"],
    [Perfil.OPERADOR_ESTOQUE]: ["create", "read", "update", "delete"],
    [Perfil.APENAS_VISUALIZACAO]: ["read"],
  },

  movimentacao: {
    [Perfil.ADMINISTRADOR_SISTEMA]: ["create", "read", "update", "delete"],
    [Perfil.GERENTE_SUPERVISOR]: ["create", "read", "update", "delete"],
    [Perfil.OPERADOR_ESTOQUE]: ["create", "read", "update", "delete"],
    [Perfil.FINANCEIRO_CONTADOR]: ["read"],
    [Perfil.APENAS_VISUALIZACAO]: ["read"],
  },
};
