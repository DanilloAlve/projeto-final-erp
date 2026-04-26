import { Perfil } from "../types/Perfil.js";
export const permissions = {
    usuario: {
        [Perfil.GESTOR]: ["create", "read", "update", "delete"],
    },
    financeiro: {
        [Perfil.GESTOR]: ["create", "read", "update", "delete"],
        [Perfil.SOLICITANTE]: ["read"],
        [Perfil.COMPRADOR]: ["read"],
    },
    pedido: {
        [Perfil.GESTOR]: ["create", "read", "update"],
        [Perfil.SOLICITANTE]: ["create", "read"],
        [Perfil.COMPRADOR]: ["create", "read"],
    },
    produto: {
        [Perfil.GESTOR]: ["create", "read", "update", "delete"],
        [Perfil.SOLICITANTE]: ["read"],
        [Perfil.COMPRADOR]: ["read"],
    },
    cliente: {
        [Perfil.GESTOR]: ["create", "read", "update", "delete"],
        [Perfil.SOLICITANTE]: ["read"],
        [Perfil.COMPRADOR]: ["read"],
    },
    movimentacao: {
        [Perfil.GESTOR]: ["create", "read", "update", "delete"],
        [Perfil.SOLICITANTE]: ["create", "read"],
        [Perfil.COMPRADOR]: ["create", "read"],
    },
};
//# sourceMappingURL=permissions.js.map