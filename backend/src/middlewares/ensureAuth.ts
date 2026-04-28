import type { RequestHandler } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { AppError } from "../errors/AppErrors.js";
import { Perfil } from "../types/Perfil.js";
import { perfilJwtParaEnum } from "../utils/perfil.js";

declare global {
    namespace Express {
        interface Request {
            auth?: AuthPayload;
        }
    }
}

export interface AuthPayload extends JwtPayload {
    sub: string;
    /** Depois do `ensureAuth`: sempre número `Perfil` (enum interno). No JWT bruto pode ser string (chave frontend) ou número. */
    perfil?: Perfil;
    funcao?: unknown;
}

const getAccessSecret = () => {
    const value = process.env.JWT_ACCESS_SECRET;
    if (!value) {
        throw new AppError("JWT_ACCESS_SECRET nao definido", 500);
    }
    return value;
};

export const ensureAuth: RequestHandler = (req, _res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return next(new AppError("Token ausente", 401));
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
        return next(new AppError("Token ausente", 401));
    }

    try {
        const payload = jwt.verify(token, getAccessSecret()) as AuthPayload;
        const rawPerfil = payload.perfil ?? payload.funcao;
        const perfilEnum = perfilJwtParaEnum(rawPerfil);
        if (perfilEnum === undefined) {
            return next(new AppError("Perfil ausente ou invalido no token", 403));
        }
        (req as { auth?: AuthPayload }).auth = {
            ...payload,
            perfil: perfilEnum,
        };
        return next();
    } catch {
        return next(new AppError("Token invalido", 401));
    }
};