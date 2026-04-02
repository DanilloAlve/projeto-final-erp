import { Request, Response } from "express";
import { FinanceiroService } from "../services/FinanceiroService.js";

export class FinanceiroController {
private financeiroService = new FinanceiroService();

async create(req: Request, res: Response): Promise<Response> {
try {
    const financeiro = await this.financeiroService.create(req.body);
    return res.status(201).json(financeiro);
} catch (error: any) {
    return res.status(400).json({ message: error.message });
}
}

async findAll(req: Request, res: Response): Promise<Response> {
try {
    const registros = await this.financeiroService.findAll();
    return res.status(200).json(registros);
} catch (error: any) {
    return res.status(500).json({ message: error.message });
}
}

async findById(req: Request, res: Response): Promise<Response> {
try {
    const id = Number(req.params.id);
    const registro = await this.financeiroService.findById(id);
    return res.status(200).json(registro);
} catch (error: any) {
    return res.status(404).json({ message: error.message });
}
}

async update(req: Request, res: Response): Promise<Response> {
try {
    const id = Number(req.params.id);
    const registroAtualizado = await this.financeiroService.update(id, req.body);
    return res.status(200).json(registroAtualizado);
} catch (error: any) {
    return res.status(400).json({ message: error.message });
}
}

async delete(req: Request, res: Response): Promise<Response> {
try {
    const id = Number(req.params.id);
    await this.financeiroService.delete(id);
    return res.status(204).send();
} catch (error: any) {
    return res.status(404).json({ message: error.message });
}
}
}