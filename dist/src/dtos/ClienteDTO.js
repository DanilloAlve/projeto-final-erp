import { z } from "zod";
export const clienteIdParamsSchema = z.object({
    id: z.string().regex(/^\d+$/, "ID de cliente invalido"),
});
export const createClienteSchema = z.object({
    nome: z.string().min(3, "Nome obrigatorio"),
    cpf_cnpj: z.string().min(11, "CPF/CNPJ invalido"),
    email: z.string().email("Email invalido").optional(),
    telefone: z.string().min(8, "Telefone invalido").optional(),
});
export const updateClienteSchema = z.object({
    nome: z.string().min(3, "Nome obrigatorio").optional(),
    cpf_cnpj: z.string().min(11, "CPF/CNPJ invalido").optional(),
    email: z.string().email("Email invalido").optional(),
    telefone: z.string().min(8, "Telefone invalido").optional(),
});
//# sourceMappingURL=ClienteDTO.js.map