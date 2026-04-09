import { z } from "zod";

export const tipoFinanceiroEnum = z.enum(["receita", "despesa"]);
export const statusFinanceiroEnum = z.enum(["pendente", "pago", "cancelado"]);

// 🔹 CREATE
export const createFinanceiroSchema = z.object({
  tipo: tipoFinanceiroEnum,
  descricao: z.string().min(3, "Descrição obrigatória"),
  valor: z.number().positive("Valor deve ser maior que zero"),
  data_vencimento: z.coerce.date(),
  status: statusFinanceiroEnum.optional(),
  data_pagamento: z.coerce.date().optional(),
});

// 🔹 UPDATE
export const updateFinanceiroSchema = z.object({
  tipo: tipoFinanceiroEnum.optional(),
  descricao: z.string().min(3).optional(),
  valor: z.number().positive().optional(),
  status: statusFinanceiroEnum.optional(),
  data_vencimento: z.coerce.date().optional(),
  data_pagamento: z.coerce.date().optional(),
});

// 🔹 PAGAR (regra específica)
export const pagarFinanceiroSchema = z.object({
  data_pagamento: z.coerce.date().optional(),
});

// 🔹 TYPES
export type CreateFinanceiroDTO = z.infer<typeof createFinanceiroSchema>;
export type UpdateFinanceiroDTO = z.infer<typeof updateFinanceiroSchema>;
export type PagarFinanceiroDTO = z.infer<typeof pagarFinanceiroSchema>;