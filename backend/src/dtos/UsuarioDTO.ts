import { z } from "zod";
import { Perfil } from "../types/Perfil.js";
import { perfilChaveParaEnum } from "../utils/perfil.js";

/** Aceita índice enum, chave string (mesmo nome do frontend `PERFIS`) ou aliases legados. */
function normalizePerfil(val: unknown): unknown {
  if (typeof val === "number" && Number.isInteger(val)) {
    return val;
  }

  if (typeof val === "string") {
    const t = val.trim();
    if (/^[0-4]$/.test(t)) return Number(t);

    const porChave = perfilChaveParaEnum(t);
    if (porChave !== undefined) return porChave;

    const upper = t.toUpperCase();
    if (upper in Perfil && typeof Perfil[upper as keyof typeof Perfil] === "number") {
      return Perfil[upper as keyof typeof Perfil];
    }

    if (upper === "GESTOR") return Perfil.GERENTE_SUPERVISOR;
    if (upper === "SOLICITANTE") return Perfil.APENAS_VISUALIZACAO;
    if (upper === "COMPRADOR") return Perfil.OPERADOR_ESTOQUE;
  }
  return val;
}

export const perfilSchema = z.preprocess(normalizePerfil, z.nativeEnum(Perfil));

const passwordRulesMessage =
  "Senha: mínimo 8 caracteres, maiúscula, minúscula, número e caractere especial";

export const createUsuarioSchema = z.object({
  nome: z.string().trim().min(1).max(100),
  email: z.email({ pattern: z.regexes.unicodeEmail }),
  password: z
    .string()
    .min(8, { message: passwordRulesMessage })
    .superRefine((s, ctx) => {
      const missing: string[] = [];
      if (!/[A-Z]/.test(s)) missing.push("1 letra maiúscula");
      if (!/[a-z]/.test(s)) missing.push("1 letra minúscula");
      if (!/[0-9]/.test(s)) missing.push("1 número");
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
