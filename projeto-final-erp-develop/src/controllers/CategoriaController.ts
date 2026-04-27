import type { Request, Response } from "express";
import type { CategoriaService, CreateCategoriaDTO, UpdateCategoriaDTO } from "../services/CategoriaService.js";
import { AppError } from "../errors/AppErrors.js";

export default class CategoriaController {
    private categoriaService: CategoriaService;

    constructor(categoriaService: CategoriaService) {
        this.categoriaService = categoriaService;
    }

    async findAllCategoria(_req: Request, res: Response) {
        const categorias = await this.categoriaService.findAll();
        return res.status(200).json(categorias);
    }

    async findCategoriaById(req: Request, res: Response) {
        const categoria = await this.categoriaService.getById(req.params.id as string);
        if (!categoria) {
            throw new AppError("Categoria nao encontrada!", 404);
        }
        return res.status(200).json(categoria);
    }

    async createCategoria(req: Request, res: Response) {
        const categoria = await this.categoriaService.createCategoria(req.body as CreateCategoriaDTO);
        return res.status(201).json(categoria);
    }

    async updateCategoria(req: Request, res: Response) {
        const { id } = req.params;
        if (!id || Array.isArray(id)) {
            throw new AppError("Categoria id inválido", 400);
        }

        const categoria = await this.categoriaService.updateCategoria(
            id,
            req.body as UpdateCategoriaDTO
        );

        return res.status(200).json(categoria);
    }

    async deleteCategoria(req: Request, res: Response) {
        const id = req.params.id;
        if (!id || Array.isArray(id)) {
            throw new AppError("Categoria id inválido", 400);
        }

        await this.categoriaService.deleteCategoria(id);

        return res.status(204).send();
    }
}
