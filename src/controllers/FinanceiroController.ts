import { Request, Response } from "express";
import { FinanceiroService } from "../services/FinanceiroService.js";
import { AppError } from "../errors/AppErrors.js";

export class FinanceiroController {
  constructor(private service: FinanceiroService) {}

  async create(req: Request, res: Response) {
    try {
      const financeiro = await this.service.create(req.body);
      return res.status(201).json(financeiro);
    } catch (error) {
      return this.handleError(error, res);
    }
  }

  async findAll(_req: Request, res: Response) {
    const lista = await this.service.findAll();
    return res.json(lista);
  }

  async findById(req: Request, res: Response) {
    try {
      const id = this.getIdParam(req);

      const financeiro = await this.service.findById(id);
      return res.json(financeiro);
    } catch (error) {
      return this.handleError(error, res);
    }
  }

  async update(req: Request, res: Response) {
    try {
      const id = this.getIdParam(req);

      const financeiro = await this.service.update(id, req.body);
      return res.json(financeiro);
    } catch (error) {
      return this.handleError(error, res);
    }
  }

  async pagar(req: Request, res: Response) {
    try {
      const id = this.getIdParam(req);

      const financeiro = await this.service.pagar(id);
      return res.json(financeiro);
    } catch (error) {
      return this.handleError(error, res);
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const id = this.getIdParam(req);

      await this.service.delete(id);
      return res.status(204).send();
    } catch (error) {
      return this.handleError(error, res);
    }
  }

  private getIdParam(req: Request): string {
    const id = req.params.id;

    if (!id || Array.isArray(id)) {
      throw new AppError("ID inválido", 400);
    }

    return id;
  }

  private handleError(error: unknown, res: Response) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    console.error(error);
    return res.status(500).json({ message: "Erro interno" });
  }
}