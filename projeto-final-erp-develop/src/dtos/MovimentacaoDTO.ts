import { z } from "zod";
import { TipoMovimentacao, MotivoMovimentacao } from "../entities/Movimentacao.js";

// Criar
export const createMovimentacaoSchema = z.object({
  produtoId: z.string().uuid("Produto inválido"),
  tipo: z.nativeEnum(TipoMovimentacao),
  quantidade: z
    .number()
    .positive("Quantidade deve ser maior que zero"),
  motivo: z.nativeEnum(MotivoMovimentacao),
  observacao: z.string().max(255).optional(),
});

// Atualizar (se precisar no futuro)
export const updateMovimentacaoSchema = z.object({
  tipo: z.nativeEnum(TipoMovimentacao).optional(),
  quantidade: z.number().positive().optional(),
  motivo: z.nativeEnum(MotivoMovimentacao).optional(),
  observacao: z.string().max(255).optional(),
});

// Tipos
export type CreateMovimentacaoDTO = z.infer<typeof createMovimentacaoSchema>;
export type UpdateMovimentacaoDTO = z.infer<typeof updateMovimentacaoSchema>;