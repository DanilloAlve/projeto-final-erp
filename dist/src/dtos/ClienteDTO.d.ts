import { z } from "zod";
export declare const clienteIdParamsSchema: z.ZodObject<{
    id: z.ZodString;
}, z.core.$strip>;
export declare const createClienteSchema: z.ZodObject<{
    nome: z.ZodString;
    cpf_cnpj: z.ZodString;
    email: z.ZodOptional<z.ZodString>;
    telefone: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const updateClienteSchema: z.ZodObject<{
    nome: z.ZodOptional<z.ZodString>;
    cpf_cnpj: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    telefone: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type CreateClienteDTO = z.infer<typeof createClienteSchema>;
export type UpdateClienteDTO = z.infer<typeof updateClienteSchema>;
//# sourceMappingURL=ClienteDTO.d.ts.map