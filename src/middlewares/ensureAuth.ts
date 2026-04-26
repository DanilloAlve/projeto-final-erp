import type { RequestHandler } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { appDataSource } from "../database/appDataSource.js";
import { AppError } from "../errors/AppErrors.js";
import { AuthService } from "../services/AuthService.js";
import { Perfil } from "../types/Perfil.js";

declare global {
    namespace Express {
        interface Request {
            auth?: AuthPayload;
        }
    }
}

export interface AuthPayload extends JwtPayload {
    sub: string; // ID do usuário
    perfil: Perfil; // Perfil do usuário (ex: admin, user)
}

const getAccessSecret = () => {
    const value = process.env.JWT_ACCESS_SECRET;
    if (!value) {
        throw new AppError("JWT_ACCESS_SECRET nao definido", 500);
    }
    return value;
};

const authService = new AuthService(appDataSource);

export const ensureAuth: RequestHandler = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return next(new AppError("Token ausente", 401));
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
        return next(new AppError("Token ausente", 401));
    }

    try {
        const payload = jwt.verify(token, getAccessSecret()) as JwtPayload;
        (req as { auth?: JwtPayload }).auth = payload;
        return next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            const refreshTokenHeader = req.headers["x-refresh-token"];
            const refreshToken = Array.isArray(refreshTokenHeader)
                ? refreshTokenHeader[0]
                : refreshTokenHeader;

            if (!refreshToken) {
                return next(new AppError("Access token expirado", 401));
            }

            try {
                const refreshed = await authService.refresh(refreshToken);
                const payload = jwt.verify(refreshed.accessToken, getAccessSecret()) as JwtPayload;
                (req as { auth?: JwtPayload }).auth = payload;

                // Retorna novos tokens para o cliente atualizar o estado local.
                res.setHeader("x-access-token", refreshed.accessToken);
                res.setHeader("x-refresh-token", refreshed.refreshToken);
                return next();
            } catch {
                return next(new AppError("Sessao expirada. Faca login novamente", 401));
            }
        }

        return next(new AppError("Token invalido", 401));
    }
};