import { Request, Response } from "express";
import { AppError } from "../errors/AppErrors.js";
import { AuthService } from "../services/AuthService.js";

export class AuthController {
  constructor(private authService: AuthService) {}

  async login(req: Request, res: Response) {
    try {
      const { email, senha } = req.body;
      const meta: { ip?: string; userAgent?: string } = {};
      if (typeof req.ip === "string" && req.ip.length > 0) {
        meta.ip = req.ip;
      }
      const userAgent = req.headers["user-agent"];
      if (typeof userAgent === "string" && userAgent.length > 0) {
        meta.userAgent = userAgent;
      }
      const authData = await this.authService.login(email, senha, meta);

      return res.json({
        usuario: authData.usuario,
        accessToken: authData.accessToken,
        refreshToken: authData.refreshToken,
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
      const authData = await this.authService.refresh(refreshToken);

      return res.json({
        usuario: authData.usuario,
        accessToken: authData.accessToken,
        refreshToken: authData.refreshToken,
      });
    } catch (error) {
      console.error(error);
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ message: error.message });
      }
      return res.status(500).json({ message: "Erro interno" });
    }
  }

  async google(req: Request, res: Response) {
    try {
      const { idToken } = req.body;
      const meta: { ip?: string; userAgent?: string } = {};
      if (typeof req.ip === "string" && req.ip.length > 0) {
        meta.ip = req.ip;
      }
      const userAgent = req.headers["user-agent"];
      if (typeof userAgent === "string" && userAgent.length > 0) {
        meta.userAgent = userAgent;
      }
      const authData = await this.authService.loginComGoogle(idToken, meta);

      return res.json({
        usuario: authData.usuario,
        accessToken: authData.accessToken,
        refreshToken: authData.refreshToken,
      });
    } catch (error) {
      console.error(error);
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ message: error.message });
      }
      return res.status(500).json({ message: "Erro interno" });
    }
  }

  async logout(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;
      await this.authService.logout(refreshToken);
      return res.json({ message: "Logout realizado com sucesso" });
    } catch (error) {
      console.error(error);
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ message: error.message });
      }
      return res.status(500).json({ message: "Erro interno" });
    }
  }
}