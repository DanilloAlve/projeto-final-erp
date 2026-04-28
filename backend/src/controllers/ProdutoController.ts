import type { Request, Response } from "express";
import type { CreateProdutoDTO, ProdutoService, UpdateProdutoDTO } from "../services/ProdutoService.js";
import { AppError } from "../errors/AppErrors.js";

export default class ProdutoController {
    private produtoService: ProdutoService;

    constructor(produtoService: ProdutoService) {
        this.produtoService = produtoService;
    }

    async findAllProduto(req: Request, res: Response) {
        const hasPaginationOrFilters =
            req.query.page !== undefined ||
            req.query.limit !== undefined ||
            req.query.nome !== undefined ||
            req.query.estoque !== undefined;

        if (!hasPaginationOrFilters) {
            const produtos = await this.produtoService.findAllList();
            return res.status(200).json(produtos);
        }

        const page = Number(req.query.page ?? 1);
        const limit = Number(req.query.limit ?? 10);
        const nome = typeof req.query.nome === "string" ? req.query.nome.trim() : "";
        const estoque =
            req.query.estoque === "em-estoque" || req.query.estoque === "fora-de-estoque"
                ? req.query.estoque
                : "todos";

        const produtos = await this.produtoService.findAll({
            page: Number.isNaN(page) ? 1 : page,
            limit: Number.isNaN(limit) ? 10 : limit,
            nome: nome || undefined,
            estoque,
        });
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

