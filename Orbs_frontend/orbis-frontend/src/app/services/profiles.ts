export const PERFIS = [
  'ADMINISTRADOR_SISTEMA',
  'GERENTE_SUPERVISOR',
  'OPERADOR_ESTOQUE',
  'FINANCEIRO_CONTADOR',
  'APENAS_VISUALIZACAO',
] as const;

export type Perfil = (typeof PERFIS)[number];

export const PERFIL_LABELS: Record<Perfil, string> = {
  ADMINISTRADOR_SISTEMA: 'Administrador do Sistema',
  GERENTE_SUPERVISOR: 'Gerente / Supervisor',
  OPERADOR_ESTOQUE: 'Operador de Estoque',
  FINANCEIRO_CONTADOR: 'Financeiro / Contador',
  APENAS_VISUALIZACAO: 'Apenas Visualizacao',
};
