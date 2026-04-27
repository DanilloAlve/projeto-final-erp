import { Request, Response, NextFunction } from "express";
import { permissions } from "../config/permissions.js";
import { AppError } from "../errors/AppErrors.js";
import { Perfil } from "../types/Perfil.js";

export function authorize(module: string, action: string) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const user = req.auth;

    if (!user || !user.perfil) {
      throw new AppError("Usuário não autenticado", 401);
    }

    const perfil = user.perfil as Perfil;

    const modulePermissions = permissions[module];

    if (!modulePermissions) {
      throw new AppError("Módulo não configurado", 500);
    }

    const allowedActions = modulePermissions[perfil];

    if (!allowedActions || !allowedActions.includes(action as any)) {
      throw new AppError("Acesso negado", 403);
    }

    next();
  };
}