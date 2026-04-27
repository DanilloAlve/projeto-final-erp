import { Request, Response } from "express";
import { ItemPedidoService } from "../services/ItemPedidoService.js";
import { AppError } from "../errors/AppErrors.js";
import {
  itemPedidoIdParamSchema,
  listItemPedidoQuerySchema,
  type CreateItemPedidoDTO,
  type UpdateItemPedidoDTO,
} from "../dtos/ItemPedidoDTO.js";

export class ItemPedidoController {
  constructor(private itemPedidoService: ItemPedidoService) {}

  async create(req: Request, res: Response) {
    try {
      const data = req.body as CreateItemPedidoDTO;
      const item = await this.itemPedidoService.create(data);
      return res.status(201).json(item);
    } catch (error) {
      return this.handleError(error, res);
    }
  }

  async findAll(req: Request, res: Response) {
    try {
      const queryParsed = listItemPedidoQuerySchema.safeParse(req.query);
      if (!queryParsed.success) {
        return res.status(400).json({
          message: "Parâmetros de consulta inválidos",
          errors: queryParsed.error.issues,
        });
      }

      const itens = await this.itemPedidoService.findAll(queryParsed.data.pedidoId);
      return res.json(itens);
    } catch (error) {
      return this.handleError(error, res);
    }
  }

  async findById(req: Request, res: Response) {
    try {
      const id = this.parseIdParam(req.params.id);

      const item = await this.itemPedidoService.findById(id);
      return res.json(item);
    } catch (error) {
      return this.handleError(error, res);
    }
  }  

  async update(req: Request, res: Response) {
    try {
      const id = this.parseIdParam(req.params.id);
      const data = req.body as UpdateItemPedidoDTO;
      const item = await this.itemPedidoService.update(id, data);
      return res.json(item);
    } catch (error) {
      return this.handleError(error, res);
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const id = this.parseIdParam(req.params.id);
      await this.itemPedidoService.delete(id);
      return res.status(204).send();
    } catch (error) {
      return this.handleError(error, res);
    }
  }

  private parseIdParam(raw: string | string[] | undefined): number {
    const single = Array.isArray(raw) ? raw[0] : raw;
    const parsed = itemPedidoIdParamSchema.safeParse(single);
    if (!parsed.success) {
      throw new AppError("ID inválido", 400);
    }
    return parsed.data;
  }

  private handleError(error: unknown, res: Response) {
    console.error(error);

    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        message: error.message,
        details: error.details,
      });
    }

    return res.status(500).json({
      message: "Erro interno",
    });
  }
}
