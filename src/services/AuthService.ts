import type { DataSource, Repository } from "typeorm";
import { compare } from "bcryptjs";
import { createHash } from "crypto";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { Usuario } from "../entities/Usuario.js";
import { Sessao } from "../entities/Sessao.js";
import { AppError } from "../errors/AppErrors.js";

/** Dados do usuário seguros para resposta de API (sem senha). */
export type UsuarioAuthPublico = Pick<Usuario, "id_user" | "nome" | "email" | "perfil">;

export class AuthService {
    private userRepo: Repository<Usuario>;
    private sessionRepo: Repository<Sessao>;

    constructor(dataSource: DataSource) {
        this.userRepo = dataSource.getRepository(Usuario);
        this.sessionRepo = dataSource.getRepository(Sessao);
    }

    private hashToken(token: string): string {
        return createHash("sha256").update(token).digest("hex");
    }

    private gerarAccessToken(usuario: Usuario): string {
        return (jwt.sign as Function)(
            { sub: usuario.id_user, perfil: usuario.perfil },
            process.env.JWT_ACCESS_SECRET!,
            { expiresIn: "15m" }
        );
    }

    private gerarRefreshToken(sessionId: string, userId: string): string {
        return (jwt.sign as Function)(
            { sub: userId, sid: sessionId },
            process.env.JWT_REFRESH_SECRET!,
            { expiresIn: "7d" }
        );
    }

    private toUsuarioPublico(usuario: Usuario): UsuarioAuthPublico {
        return {
            id_user: usuario.id_user,
            nome: usuario.nome,
            email: usuario.email,
            perfil: usuario.perfil,
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