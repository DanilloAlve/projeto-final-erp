import { z } from "zod";

export const createItemPedidoSchema = z.object({
  pedidoId: z.string().uuid("Pedido inválido"),
  produtoId: z.string().uuid("Produto inválido"),
  quantidade: z.coerce.number().int().positive("Quantidade deve ser um inteiro positivo"),
  preco_unitario: z.coerce.number().positive("Preço unitário deve ser maior que zero"),
});

export const updateItemPedidoSchema = createItemPedidoSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Informe ao menos um campo para atualizar",
  });

export const itemPedidoIdParamSchema = z.coerce.number().int().positive();

export const listItemPedidoQuerySchema = z.object({
  pedidoId: z.preprocess(
    (val) => (Array.isArray(val) ? val[0] : val),
    z.string().uuid("pedidoId inválido").optional()
  ),
});

export type CreateItemPedidoDTO = z.infer<typeof createItemPedidoSchema>;
export type UpdateItemPedidoDTO = z.infer<typeof updateItemPedidoSchema>;
