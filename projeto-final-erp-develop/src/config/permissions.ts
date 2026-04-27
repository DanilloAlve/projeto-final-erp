import { Perfil } from "../types/Perfil.js";

type Action = "create" | "read" | "update" | "delete";

type PermissionMap = {
  [module: string]: {
    [perfil in Perfil]?: Action[];
  };
};

export const permissions: PermissionMap = {
  usuario: {
    [Perfil.ADMINISTRADOR_SISTEMA]: ["create", "read", "update", "delete"],
    [Perfil.GERENTE_SUPERVISOR]: ["create", "read", "update", "delete"],
    [Perfil.APENAS_VISUALIZACAO]: ["read"],
  },

  cliente: {
    [Perfil.ADMINISTRADOR_SISTEMA]: ["create", "read", "update", "delete"],
    [Perfil.GERENTE_SUPERVISOR]: ["read"],
    [Perfil.FINANCEIRO_CONTADOR]: ["read"],
    [Perfil.APENAS_VISUALIZACAO]: ["read"],
  },

  categoria: {
    [Perfil.ADMINISTRADOR_SISTEMA]: ["create", "read", "update", "delete"],
    [Perfil.GERENTE_SUPERVISOR]: ["read"],
    [Perfil.OPERADOR_ESTOQUE]: ["create", "read", "update", "delete"],
    [Perfil.FINANCEIRO_CONTADOR]: ["read"],
    [Perfil.APENAS_VISUALIZACAO]: ["read"],
  },

  financeiro: {
    [Perfil.ADMINISTRADOR_SISTEMA]: ["create", "read", "update", "delete"],
    [Perfil.FINANCEIRO_CONTADOR]: ["create", "read", "update", "delete"],
    [Perfil.GERENTE_SUPERVISOR]: ["read"],
    [Perfil.APENAS_VISUALIZACAO]: ["read"],
  },

  pedido: {
    [Perfil.ADMINISTRADOR_SISTEMA]: ["create", "read", "update", "delete"],
    [Perfil.GERENTE_SUPERVISOR]: ["read", "update"],
    [Perfil.OPERADOR_ESTOQUE]: ["read"],
    [Perfil.FINANCEIRO_CONTADOR]: ["read"],
    [Perfil.APENAS_VISUALIZACAO]: ["read"],
  },

  produto: {
    [Perfil.ADMINISTRADOR_SISTEMA]: ["create", "read", "update", "delete"],
    [Perfil.GERENTE_SUPERVISOR]: ["read"],
    [Perfil.OPERADOR_ESTOQUE]: ["create", "read", "update", "delete"],
    [Perfil.FINANCEIRO_CONTADOR]: ["read"],
    [Perfil.APENAS_VISUALIZACAO]: ["read"],
  },

  movimentacao: {
    [Perfil.ADMINISTRADOR_SISTEMA]: ["create", "read", "update", "delete"],
    [Perfil.GERENTE_SUPERVISOR]: ["create", "read"],
    [Perfil.OPERADOR_ESTOQUE]: ["create", "read", "update", "delete"],
    [Perfil.FINANCEIRO_CONTADOR]: ["read"],
    [Perfil.APENAS_VISUALIZACAO]: ["read"],
  },
};