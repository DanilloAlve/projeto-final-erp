import { Request, Response } from "express";
import { compare } from "bcryptjs";
import jwt from "jsonwebtoken";
import { loginSchema } from "../dtos/AuthDTO.js";
import { UsuarioService } from "../services/UsuarioService.js";
import { AppError } from "../errors/AppErrors.js";
import type { SignOptions } from "jsonwebtoken";
import { Subject } from "typeorm/persistence/Subject.js";

export class AuthController {
  constructor(private usuarioService: UsuarioService) {}

  async login(req: Request, res: Response) {
    try {
      // validação com Zod
      const result = loginSchema.safeParse(req.body);

      if (!result.success) {
        return res.status(400).json(result.error.format());
      }

      const { email, senha } = result.data;

      // busca usuário
      const usuario = await this.usuarioService.getByEmail(email);

      console.log(usuario);

      if (!usuario) {
        throw new AppError("Credenciais inválidas", 401);
      }

      // compara senha
      const senhaValida = await compare(senha, usuario.senha);

      if (!senhaValida) {
        throw new AppError("Credenciais inválidas", 401);
      }

    const jwtSecret = process.env.JWT_ACCESS_SECRET as string;
    const jwtExpires = process.env.JWT_ACCESS_EXPIRATION as string;

    const refreshSecret = process.env.JWT_REFRESH_SECRET as string;
    const refreshExpires = process.env.JWT_REFRESH_EXPIRATION as string;      

    const accessToken = jwt.sign(
        {
            perfil: usuario.perfil
         },
        process.env.JWT_ACCESS_SECRET as string,
        {
            subject: usuario.id_user,
            expiresIn: process.env.JWT_ACCESS_EXPIRATION as SignOptions["expiresIn"],
        } as any
    );
    
    const refreshToken = jwt.sign(
        {  
            perfil: usuario.perfil
         },
        process.env.JWT_REFRESH_SECRET as string,
        {
            subject: usuario.id_user,
            expiresIn: process.env.JWT_REFRESH_EXPIRATION as SignOptions["expiresIn"],
        } as any
    );

    return res.json({
        accessToken,
        refreshToken,
    });

    } catch (error) {
      console.error(error);
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ message: error.message });
      }
      return res.status(500).json({ message: "Erro interno" });
    }
  }

  async refresh(req: Request, res: Response) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError("Refresh token não informado", 400);
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET as string
    ) as { id: string };

    const newAccessToken = jwt.sign(
      { id: decoded.id },
      process.env.JWT_ACCESS_SECRET as string,
      {
        expiresIn: process.env.JWT_ACCESS_EXPIRATION as string,
      } as any
    );

    return res.json({ accessToken: newAccessToken });

  } catch {
    return res.status(401).json({ message: "Refresh token inválido" });
  }
}

async logout(req: Request, res: Response) {
  return res.json({ message: "Logout realizado com sucesso" });
}
    
}