import { z } from "zod";
import { Perfil } from "../types/Perfil.js";

/** Aceita 0|1|2, "0"|"1"|"2" ou SOLICITANTE|GESTOR|COMPRADOR (JSON costuma mandar números como string). */
function normalizePerfil(val: unknown): unknown {
  if (val === Perfil.SOLICITANTE || val === Perfil.GESTOR || val === Perfil.COMPRADOR) {
    return val;
  }
  if (typeof val === "string") {
    const t = val.trim();
    if (/^[0-2]$/.test(t)) return Number(t);
    const upper = t.toUpperCase();
    if (upper === "SOLICITANTE") return Perfil.SOLICITANTE;
    if (upper === "GESTOR") return Perfil.GESTOR;
    if (upper === "COMPRADOR") return Perfil.COMPRADOR;
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
