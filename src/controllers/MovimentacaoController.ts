import { Request, Response } from "express";
import { MovimentacaoEstoqueService } from "../services/MovimentacaoService.js";
import { AppError } from "../errors/AppErrors.js";
import type { CreateMovimentacaoDTO } from "../dtos/MovimentacaoDTO.js";

export class MovimentacaoEstoqueController {
  constructor(private service: MovimentacaoEstoqueService) {}

  // CREATE
    async create(req: Request, res: Response) {
    try {
        if (!req.auth?.sub) {
        throw new AppError("Usuário não autenticado", 401);
        }

        const data = req.body as CreateMovimentacaoDTO;

        const movimentacao = await this.service.create({
            produtoId: data.produtoId,
            tipo: data.tipo,
            quantidade: data.quantidade,
            motivo: data.motivo,
            usuarioId: req.auth.sub,
            ...(data.observacao !== undefined && { observacao: data.observacao }),
        });

        return res.status(201).json({
        message: "Movimentação criada com sucesso",
        data: movimentacao,
        });
    } catch (error) {
        return this.handleError(error, res);
    }
    }

  // LISTAR TODOS
  async findAll(_req: Request, res: Response) {
    try {
      const data = await this.service.findAll();

      return res.status(200).json({
        total: data.length,
        data,
      });
    } catch (error) {
      return this.handleError(error, res);
    }
  }

  // BUSCAR POR ID
  async findById(req: Request, res: Response) {
    try {
      const id = this.getIdParam(req);
      const data = await this.service.findById(id);

      return res.status(200).json({
        data,
      });
    } catch (error) {
      return this.handleError(error, res);
    }
  }

  // DELETE
  async delete(req: Request, res: Response) {
    try {
      const id = this.getIdParam(req);

      await this.service.delete(id);

      return res.status(204).send();
    } catch (error) {
      return this.handleError(error, res);
    }
  }

  // valida ID
  private getIdParam(req: Request): string {
    const id = req.params.id;

    if (!id || Array.isArray(id)) {
      throw new AppError("ID inválido", 400);
    }

    return id;
  }

  // padrão global de erro
  private handleError(error: unknown, res: Response) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        message: error.message,
      });
    }

    console.error("Erro interno:", error);

    return res.status(500).json({
      message: "Erro interno do servidor",
    });
  }
}