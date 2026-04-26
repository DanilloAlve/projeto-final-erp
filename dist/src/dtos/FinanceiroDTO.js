import { z } from "zod";
export const tipoFinanceiroEnum = z.enum(["receita", "despesa"]);
export const statusFinanceiroEnum = z.enum(["pendente", "pago", "cancelado"]);
const MAX_VALOR_FINANCEIRO = 9_999_999.99;
// 🔹 CREATE
export const createFinanceiroSchema = z.object({
    tipo: tipoFinanceiroEnum,
    descricao: z.string().min(3, "Descrição obrigatória"),
    valor: z
        .number()
        .positive("Valor deve ser maior que zero")
        .max(MAX_VALOR_FINANCEIRO, "Valor maximo permitido e 9.999.999,99"),
    data_vencimento: z.coerce.date(),
    status: statusFinanceiroEnum.optional(),
    data_pagamento: z.coerce.date().optional(),
});
// 🔹 UPDATE
export const updateFinanceiroSchema = z.object({
    tipo: tipoFinanceiroEnum.optional(),
    descricao: z.string().min(3).optional(),
    valor: z
        .number()
        .positive("Valor deve ser maior que zero")
        .max(MAX_VALOR_FINANCEIRO, "Valor maximo permitido e 9.999.999,99")
        .optional(),
    status: statusFinanceiroEnum.optional(),
    data_vencimento: z.coerce.date().optional(),
    data_pagamento: z.coerce.date().optional(),
});
// 🔹 PAGAR (regra específica)
export const pagarFinanceiroSchema = z.object({
    data_pagamento: z.coerce.date().optional(),
});
//# sourceMappingURL=FinanceiroDTO.js.map