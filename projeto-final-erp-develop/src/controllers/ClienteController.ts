import { Request, Response } from "express";
import { ClienteService } from "../services/ClienteService.js";

export class ClienteController {
private clienteService = new ClienteService();

async create(req: Request, res: Response): Promise<Response> {
try {
    const cliente = await this.clienteService.create(req.body);
    return res.status(201).json(cliente);
} catch (error: any) {
    return res.status(400).json({ message: error.message });
}
}

async findAll(req: Request, res: Response): Promise<Response> {
try {
    const clientes = await this.clienteService.findAll();
    return res.status(200).json(clientes);
} catch (error: any) {
    return res.status(500).json({ message: error.message });
}
}

async findById(req: Request, res: Response): Promise<Response> {
try {
    const id = Number(req.params.id);
    const cliente = await this.clienteService.findById(id);
    return res.status(200).json(cliente);
} catch (error: any) {
    return res.status(404).json({ message: error.message });
}
}

async update(req: Request, res: Response): Promise<Response> {
try {
    const id = Number(req.params.id);
    const clienteAtualizado = await this.clienteService.update(id, req.body);
    return res.status(200).json(clienteAtualizado);
} catch (error: any) {
    return res.status(400).json({ message: error.message });
}
}

async delete(req: Request, res: Response): Promise<Response> {
try {
    const id = Number(req.params.id);
    await this.clienteService.delete(id);
    return res.status(204).send();
} catch (error: any) {
    return res.status(404).json({ message: error.message });
}
}
}