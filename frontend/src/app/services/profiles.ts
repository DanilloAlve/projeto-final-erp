export const PERFIS = [
  'ADMINISTRADOR_SISTEMA',
  'GERENTE_SUPERVISOR',
  'OPERADOR_ESTOQUE',
  'FINANCEIRO_CONTADOR',
  'APENAS_VISUALIZACAO',
] as const;

export type Perfil = (typeof PERFIS)[number];

/** Enum string alinhado a `PERFIS` — preferir em comparações de perfil (menu, permissões). */
export enum PerfilEnum {
  ADMINISTRADOR_SISTEMA = 'ADMINISTRADOR_SISTEMA',
  GERENTE_SUPERVISOR = 'GERENTE_SUPERVISOR',
  OPERADOR_ESTOQUE = 'OPERADOR_ESTOQUE',
  FINANCEIRO_CONTADOR = 'FINANCEIRO_CONTADOR',
  APENAS_VISUALIZACAO = 'APENAS_VISUALIZACAO',
}

/** Perfil usado quando a API não envia valor reconhecido ou em formulários iniciais. */
export const PERFIL_PADRAO: Perfil = 'APENAS_VISUALIZACAO';

export const PERFIL_LABELS: Record<Perfil, string> = {
  ADMINISTRADOR_SISTEMA: 'Administrador do Sistema',
  GERENTE_SUPERVISOR: 'Gerente / Supervisor',
  OPERADOR_ESTOQUE: 'Operador de Estoque',
  FINANCEIRO_CONTADOR: 'Financeiro / Contador',
  APENAS_VISUALIZACAO: 'Apenas Visualizacao',
};

export function isPerfilKey(value: string): value is Perfil {
  return (PERFIS as readonly string[]).includes(value);
}

/**
 * Converte valor vindo da API (índice numérico do enum TypeScript ou string do perfil)
 * para a chave `Perfil` única deste frontend (`PERFIS`).
 */
export function perfilFromApi(val: unknown): Perfil | undefined {
  if (val === null || val === undefined || val === '') return undefined;
  if (typeof val === 'number' && Number.isInteger(val) && val >= 0 && val < PERFIS.length) {
    return PERFIS[val];
  }
  const s = String(val).trim();
  return isPerfilKey(s) ? s : undefined;
}

/** Sempre retorna uma chave `Perfil` válida para o formulário e para envio ao backend. */
export function perfilToKeyOrDefault(val: unknown, padrao: Perfil = PERFIL_PADRAO): Perfil {
  return perfilFromApi(val) ?? padrao;
}

/**
 * Valida se há perfil (aceita índice numérico 0 — ADMINISTRADOR_SISTEMA).
 * Não usar expressões do tipo `!perfil` / `!!perfil`.
 */
export function perfilEstaDefinido(val: unknown): boolean {
  if (val === undefined || val === null || val === '') return false;
  if (typeof val === 'number') {
    return Number.isInteger(val) && val >= 0 && val < PERFIS.length;
  }
  return isPerfilKey(String(val).trim());
}

/** Chave estável para filtros e comparações (string vazia se não reconhecido). */
export function perfilChaveOuVazio(val: unknown): string {
  return perfilFromApi(val) ?? '';
}
