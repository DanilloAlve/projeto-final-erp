import type { Request, Response } from "express";
import type { CreateProdutoDTO, ProdutoService, UpdateProdutoDTO } from "../services/ProdutoService.js";
import { AppError } from "../errors/AppErrors.js";

export default class ProdutoController {
    private produtoService: ProdutoService;

    constructor(produtoService: ProdutoService) {
        this.produtoService = produtoService;
    }

    async findAllProduto(_req: Request, res: Response) {
        const produtos = await this.produtoService.findAll();
        return res.status(200).json(produtos);
    }

    async findProdutoById(req: Request, res: Response) {
        const produto = await this.produtoService.getById(req.params.id as string);
        if (!produto) {
            throw new AppError("Produto nao encontrado!", 404);
        }
        return res.status(200).json(produto);
    }

    async createProduto(req: Request, res: Response) {
        const produto = await this.produtoService.createProduto(req.body as CreateProdutoDTO);
        return res.status(201).json(produto);
    }

    async updateProduto(req: Request, res: Response) {
        const produto = await this.produtoService.updateProduto(
            req.params.id as string,
            req.body as UpdateProdutoDTO
        );
        return res.status(200).json(produto);
    }

    async deleteProduto(req: Request, res: Response) {
        await this.produtoService.deleteProduto(req.params.id as string);
        return res.status(204).send();
    }
}

