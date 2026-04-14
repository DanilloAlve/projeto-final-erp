import { z } from "zod";
import { TipoMovimentacao, MotivoMovimentacao } from "../entities/Movimentacao.js";

// CREATE
export const createMovimentacaoSchema = z.object({
  produtoId: z.string().uuid("Produto inválido"),
  tipo: z.nativeEnum(TipoMovimentacao),
  quantidade: z
    .number()
    .positive("Quantidade deve ser maior que zero"),
  motivo: z.nativeEnum(MotivoMovimentacao),
  observacao: z.string().max(255).optional(),
});

// UPDATE (se quiser no futuro)
export const updateMovimentacaoSchema = z.object({
  tipo: z.nativeEnum(TipoMovimentacao).optional(),
  quantidade: z.number().positive().optional(),
  motivo: z.nativeEnum(MotivoMovimentacao).optional(),
  observacao: z.string().max(255).optional(),
});

// TYPES (IMPORTANTE)
export type CreateMovimentacaoDTO = z.infer<typeof createMovimentacaoSchema>;
export type UpdateMovimentacaoDTO = z.infer<typeof updateMovimentacaoSchema>;