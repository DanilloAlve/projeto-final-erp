import { z } from "zod";
import { Perfil } from "../types/Perfil.js";

/** Aceita o perfil padrão e alguns nomes antigos/alternativos. */
function normalizePerfil(val: unknown): unknown {
  if (typeof val === "string") {
    const upper = val.trim().toUpperCase();
    const aliases: Record<string, Perfil> = {
      ADMINISTRADOR: Perfil.ADMINISTRADOR_SISTEMA,
      ADMINISTRADOR_SISTEMA: Perfil.ADMINISTRADOR_SISTEMA,
      GERENTE: Perfil.GERENTE_SUPERVISOR,
      SUPERVISOR: Perfil.GERENTE_SUPERVISOR,
      GERENTE_SUPERVISOR: Perfil.GERENTE_SUPERVISOR,
      OPERADOR_ESTOQUE: Perfil.OPERADOR_ESTOQUE,
      ALMOXARIFE: Perfil.OPERADOR_ESTOQUE,
      FINANCEIRO: Perfil.FINANCEIRO_CONTADOR,
      CONTADOR: Perfil.FINANCEIRO_CONTADOR,
      FINANCEIRO_CONTADOR: Perfil.FINANCEIRO_CONTADOR,
      APENAS_VISUALIZACAO: Perfil.APENAS_VISUALIZACAO,
      VISUALIZACAO: Perfil.APENAS_VISUALIZACAO,
      LEITOR: Perfil.APENAS_VISUALIZACAO,
    };
    return aliases[upper] ?? val;
  }
  return val;
}

export const perfilSchema = z.preprocess(normalizePerfil, z.enum(Perfil));

const passwordRulesMessage =
  "Senha: mínimo 6 caracteres, 1 maiúscula, 1 minúscula e 1 caractere especial";

export const createUsuarioSchema = z.object({
  nome: z.string().trim().min(1).max(100),
  email: z.email({ pattern: z.regexes.unicodeEmail }),
  password: z
    .string()
    .min(6, { message: passwordRulesMessage })
    .superRefine((s, ctx) => {
      const missing: string[] = [];
      if (!/[A-Z]/.test(s)) missing.push("1 letra maiúscula");
      if (!/[a-z]/.test(s)) missing.push("1 letra minúscula");
      if (!/[^A-Za-z0-9]/.test(s)) missing.push("1 caractere especial");
      if (missing.length) {
        ctx.addIssue({
          code: "custom",
          message: `Senha deve incluir: ${missing.join(", ")}.`,
        });
      }
    }),
  perfil: perfilSchema,
});

export const updateUsuarioSchema = createUsuarioSchema
  .omit({ password: true })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Informe ao menos um campo para atualizar",
  });

export const usuarioIdParamsSchema = z.object({
  id: z.string().uuid("ID inválido"),
});

export type CreateUsuarioDTO = z.infer<typeof createUsuarioSchema>;
export type UpdateUsuarioDTO = z.infer<typeof updateUsuarioSchema>;
