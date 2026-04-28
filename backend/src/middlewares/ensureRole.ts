import type { RequestHandler } from "express";
import type { Perfil } from "../types/Perfil.js";
import { AppError } from "../errors/AppErrors.js";

export const ensureRole = (...perfisPermitido: Perfil[]): RequestHandler => {
    return (req, _res, next) => {

        const perfilToken = req.auth?.perfil;
        // Perfil.ADMINISTRADOR_SISTEMA é 0 no enum — não usar !perfil (0 seria tratado como ausente).
        if (!req.auth || perfilToken === undefined || perfilToken === null) {
            return next(new AppError("Usuário sem perfil no token", 403));
        }

        if(!perfisPermitido.includes(perfilToken)) {
            return next(new AppError("Acesso negado", 403));
        }

        return next();

    }
}