import { Request, Response } from "express";
import { PedidoService } from "../services/PedidoService.js";
import { AppError } from "../errors/AppErrors.js";


export class PedidoController {
  constructor(private pedidoService: PedidoService) {}

  async create(req: Request, res: Response) {
    try {
      const pedido = await this.pedidoService.create(req.body);
      return res.status(201).json(pedido);
    } catch (error) {
      return this.handleError(error, res);
    }
  }

  async findAll(req: Request, res: Response) {
    try {
      const pedidos = await this.pedidoService.findAll();
      return res.json(pedidos);
    } catch (error) {
      return this.handleError(error, res);
    }
  }
 
  async findById(req: Request, res: Response) {
    try {
      const id = req.params.id;

        if (!id || typeof id !== "string") {
        throw new AppError("ID inválido", 400);
        }
  
      const pedido = await this.pedidoService.findById(id);
      return res.json(pedido);
    } catch (error) {
      return this.handleError(error, res);
    }
  }

  async updateStatus(req: Request, res: Response) {
    try {

      const id = req.params.id;

      if (!id || typeof id !== "string") {
        throw new AppError("ID inválido", 400);
      }        

      const { status } = req.body;

      if (!status) {
        throw new AppError("Status é obrigatório", 400);
      }

      const pedido = await this.pedidoService.updateStatus(id, status);        
      
      return res.json(pedido);
    } catch (error) {
      return this.handleError(error, res);
    }
  }
  
  async delete(req: Request, res: Response) {
    try {
       const id = req.params.id;

      if (!id || typeof id !== "string") {
        throw new AppError("ID inválido", 400);
      }   

      await this.pedidoService.delete(id);
      return res.status(204).send();
    } catch (error) {
      return this.handleError(error, res);
    }
  }

  // Tratamento padrão de erro (reutilizável)
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