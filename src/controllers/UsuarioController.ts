import type { Request, Response } from "express";
import type { UsuarioService } from "../services/UsuarioService.js";
import type { CreateUsuarioDTO, UpdateUsuarioDTO } from "../dtos/UsuarioDTO.js";
import { AppError } from "../errors/AppErrors.js";
import { Perfil } from "../types/Perfil.js";

export default class UsuarioController {
  private userService: UsuarioService;

   constructor(userService: UsuarioService) {
        this.userService = userService;
    }

  async findAllUser(req: Request, res: Response) {

    const users = await this.userService.findAll();
    return res.status(200).json(users);
  }

  async findUserById(req: Request, res: Response) {
    const id = req.params.id as string;

    const user = await this.userService.getById(id);

    if (!user) {
      throw new AppError("Usuario nao encontrado!", 404);
    }

    return res.status(200).json(user);
  }

  async createUser(req: Request, res: Response) {
    const data = req.body as CreateUsuarioDTO;

    const user = await this.userService.createUsuario(data);

    return res.status(201).json(user);
  }

  async updateUser(req: Request, res: Response) {
    const id = req.params.id as string;

    const data = req.body as UpdateUsuarioDTO;

    const user = await this.userService.updateUsuario(id, data);

    return res.status(200).json(user);
  }

  async deleteUser(req: Request, res: Response) {
    const id = req.params.id as string;

    if (!id || Array.isArray(id)) {
      throw new AppError("ID inválido", 400);
    }

    await this.userService.deleteUsuario(id);

    return res.status(200).json({ message: "Removido" });
  }
}