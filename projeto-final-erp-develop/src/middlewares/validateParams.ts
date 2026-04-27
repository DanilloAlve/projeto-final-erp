import type { Request, Response, NextFunction } from "express";
import type { ZodSchema } from "zod";

export function validateParams(schema: ZodSchema<Record<string, string>>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      return res.status(400).json({
        message: "Parâmetros inválidos",
        errors: result.error.issues,
      });
    }

    Object.assign(req.params, result.data);
    next();
  };
}
