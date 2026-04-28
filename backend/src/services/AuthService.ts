import type { DataSource, Repository } from "typeorm";
import { compare, hash } from "bcryptjs";
import { createHash, randomUUID } from "crypto";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { Usuario } from "../entities/Usuario.js";
import { Sessao } from "../entities/Sessao.js";
import { AppError } from "../errors/AppErrors.js";
import { Perfil } from "../types/Perfil.js";
import type { PerfilChave } from "../utils/perfil.js";
import { perfilEnumParaChave } from "../utils/perfil.js";

/** Resposta de login/refresh: `perfil` como chave string (igual ao frontend `PERFIS`). */
export type UsuarioAuthPublico = {
    id_user: string;
    nome: string;
    email: string;
    perfil: PerfilChave;
};

export class AuthService {
    private userRepo: Repository<Usuario>;
    private sessionRepo: Repository<Sessao>;
    private googleClient: OAuth2Client;

    constructor(dataSource: DataSource) {
        this.userRepo = dataSource.getRepository(Usuario);
        this.sessionRepo = dataSource.getRepository(Sessao);
        this.googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    }

    private hashToken(token: string): string {
        return createHash("sha256").update(token).digest("hex");
    }

    private gerarAccessToken(usuario: Usuario): string {
        const accessExpiration = process.env.JWT_ACCESS_EXPIRATION || "30m";
        return (jwt.sign as Function)(
            { sub: usuario.id_user, perfil: perfilEnumParaChave(usuario.perfil) },
            process.env.JWT_ACCESS_SECRET!,
            { expiresIn: accessExpiration }
        );
    }

    private gerarRefreshToken(sessionId: string, userId: string): string {
        const refreshExpiration = process.env.JWT_REFRESH_EXPIRATION || "7d";
        return (jwt.sign as Function)(
            { sub: userId, sid: sessionId },
            process.env.JWT_REFRESH_SECRET!,
            { expiresIn: refreshExpiration }
        );
    }

    private toUsuarioPublico(usuario: Usuario): UsuarioAuthPublico {
        return {
            id_user: usuario.id_user,
            nome: usuario.nome,
            email: usuario.email,
            perfil: perfilEnumParaChave(usuario.perfil),
        };
    }

    async login(email: string, senha: string, meta?: { ip?: string; userAgent?: string }) {
        const usuario = await this.userRepo.findOne({
            where: { email },            
            select: {
                id_user: true,
                nome: true,
                email: true,
                senha: true,
                perfil: true
            }
        });
        if (!usuario) {
            throw new AppError("Credenciais invalidas", 401);
        }

        const senhaCorreta = await compare(senha, usuario.senha);
        if (!senhaCorreta) {
            throw new AppError("Credenciais invalidas", 401);
        }

        const sessao = this.sessionRepo.create({
            usuario,
            refresh_token_hash: "",
            expires_at: new Date(),
            ip: meta?.ip ?? null,
            user_agent: meta?.userAgent ?? null,
        });
        await this.sessionRepo.save(sessao);

        const refreshToken = this.gerarRefreshToken(sessao.id, usuario.id_user);
        sessao.refresh_token_hash = this.hashToken(refreshToken);
        sessao.expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await this.sessionRepo.save(sessao);

        const accessToken = this.gerarAccessToken(usuario);
        return { accessToken, refreshToken, usuario: this.toUsuarioPublico(usuario) };
    }

    async loginComGoogle(idToken: string, meta?: { ip?: string; userAgent?: string }) {
        const googleClientId = process.env.GOOGLE_CLIENT_ID;
        if (!googleClientId) {
            throw new AppError("Login com Google não configurado", 500);
        }

        let payload;
        try {
            const ticket = await this.googleClient.verifyIdToken({
                idToken,
                audience: googleClientId,
            });
            payload = ticket.getPayload();
        } catch {
            throw new AppError("Token Google inválido", 401);
        }

        if (!payload?.email || !payload.sub) {
            throw new AppError("Dados da conta Google inválidos", 401);
        }

        let usuario = await this.userRepo.findOne({
            where: [{ google_id: payload.sub }, { email: payload.email }],
            select: {
                id_user: true,
                nome: true,
                email: true,
                perfil: true,
                google_id: true,
                avatar_url: true,
                senha: true,
            },
        });

        if (!usuario) {
            const senhaAleatoria = await hash(`${randomUUID()}_${Date.now()}`, 10);
            usuario = this.userRepo.create({
                nome: payload.name ?? payload.email.split("@")[0],
                email: payload.email,
                senha: senhaAleatoria,
                perfil: Perfil.APENAS_VISUALIZACAO,
                google_id: payload.sub,
                avatar_url: payload.picture ?? null,
            });
            usuario = await this.userRepo.save(usuario);
        } else {
            let precisaSalvar = false;
            if (!usuario.google_id) {
                usuario.google_id = payload.sub;
                precisaSalvar = true;
            }
            if (payload.picture && usuario.avatar_url !== payload.picture) {
                usuario.avatar_url = payload.picture;
                precisaSalvar = true;
            }
            if (precisaSalvar) {
                usuario = await this.userRepo.save(usuario);
            }
        }

        const sessao = this.sessionRepo.create({
            usuario,
            refresh_token_hash: "",
            expires_at: new Date(),
            ip: meta?.ip ?? null,
            user_agent: meta?.userAgent ?? null,
        });
        await this.sessionRepo.save(sessao);

        const refreshToken = this.gerarRefreshToken(sessao.id, usuario.id_user);
        sessao.refresh_token_hash = this.hashToken(refreshToken);
        sessao.expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await this.sessionRepo.save(sessao);

        const accessToken = this.gerarAccessToken(usuario);
        return { accessToken, refreshToken, usuario: this.toUsuarioPublico(usuario) };
    }

    async refresh(refreshToken: string) {
        let payload: JwtPayload;
        try {
            payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as JwtPayload;
        } catch {
            throw new AppError("Refresh token invalido", 401);
        }

        const sessionId = payload.sid as string | undefined;
        const userId = payload.sub as string | undefined;
        if (!sessionId || !userId) {
            throw new AppError("Refresh token invalido", 401);
        }

        const sessao = await this.sessionRepo.findOne({
            where: { id: sessionId },
            relations: { usuario: true },
        });

        if (!sessao || sessao.revoked_at) throw new AppError("Sessao invalida", 401);
        if (sessao.expires_at < new Date()) throw new AppError("Refresh token expirado", 401);
        if (sessao.refresh_token_hash !== this.hashToken(refreshToken)) throw new AppError("Refresh token invalido", 401);
        if (sessao.usuario.id_user !== userId) throw new AppError("Sessao invalida", 401);

        const novoRefreshToken = this.gerarRefreshToken(sessao.id, sessao.usuario.id_user);
        sessao.refresh_token_hash = this.hashToken(novoRefreshToken);
        sessao.expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await this.sessionRepo.save(sessao);

        const accessToken = this.gerarAccessToken(sessao.usuario);
        return {
            accessToken,
            refreshToken: novoRefreshToken,
            usuario: this.toUsuarioPublico(sessao.usuario),
        };
    }

    async logout(refreshToken: string) {
        let payload: JwtPayload;
        try {
            payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as JwtPayload;
        } catch {
            throw new AppError("Refresh token invalido", 401);
        }

        const sessionId = payload.sid as string | undefined;
        if (!sessionId) throw new AppError("Refresh token invalido", 401);

        const sessao = await this.sessionRepo.findOne({ where: { id: sessionId } });

        if (!sessao) return;

        if (sessao.refresh_token_hash !== this.hashToken(refreshToken)) {
            throw new AppError("Refresh token invalido", 401);
        }

        sessao.revoked_at = new Date();
        await this.sessionRepo.save(sessao);
    }
}