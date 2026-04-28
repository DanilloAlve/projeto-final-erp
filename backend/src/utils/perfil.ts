import { Perfil } from "../types/Perfil.js";

/**
 * Ordem e nomes idênticos ao `PERFIS` / `Perfil` do frontend (`profiles.ts`).
 * Índice = valor numérico do enum TypeScript `Perfil` no backend.
 */
export const PERFIS_CHAVE = [
  "ADMINISTRADOR_SISTEMA",
  "GERENTE_SUPERVISOR",
  "OPERADOR_ESTOQUE",
  "FINANCEIRO_CONTADOR",
  "APENAS_VISUALIZACAO",
] as const;

export type PerfilChave = (typeof PERFIS_CHAVE)[number];

export const PERFIL_PADRAO_CHAVE: PerfilChave = "APENAS_VISUALIZACAO";

export function perfilEnumParaChave(p: Perfil | undefined | null): PerfilChave {
  if (p === undefined || p === null) {
    return PERFIL_PADRAO_CHAVE;
  }
  const k = PERFIS_CHAVE[p as number];
  if (!k) {
    throw new Error(`Valor de perfil enum inválido: ${String(p)}`);
  }
  return k;
}

export function perfilChaveParaEnum(chave: string): Perfil | undefined {
  const upper = chave.trim().toUpperCase() as PerfilChave;
  const idx = PERFIS_CHAVE.indexOf(upper);
  return idx >= 0 ? (idx as unknown as Perfil) : undefined;
}

/**
 * JWT pode carregar perfil como número (legado) ou string (chave do frontend).
 */
export function perfilJwtParaEnum(val: unknown): Perfil | undefined {
  if (val === undefined || val === null) return undefined;
  if (typeof val === "number" && Number.isInteger(val) && val >= 0 && val < PERFIS_CHAVE.length) {
    return val as Perfil;
  }
  if (typeof val === "string") {
    return perfilChaveParaEnum(val);
  }
  return undefined;
}
