import type { DataSource, Repository } from "typeorm";
import { Produto } from "../entities/Produto.js";
import { Categoria } from "../entities/Categoria.js";
import { AppError } from "../errors/AppErrors.js";

export type CreateProdutoDTO = {
    nome: string;
    descricao?: string | null;
    codigo: string;
    preco: number;
    estoque_atual?: number;
    estoque_minimo: number;
    estoque_maximo?: number | null;
    ativo?: boolean;
    categoriaId?: string;
};

export type UpdateProdutoDTO = Partial<CreateProdutoDTO>;

export class ProdutoService {
    private produtoRepo: Repository<Produto>;
    private categoriaRepo: Repository<Categoria>;

    constructor(dataSource: DataSource) {
        this.produtoRepo = dataSource.getRepository(Produto);
        this.categoriaRepo = dataSource.getRepository(Categoria);
    }

    async getById(id: string | number) {
        return await this.produtoRepo.findOne({
            where: { id_prod: id as never },
            relations: { categoria: true },
        });
    }

    async findAll() {
        return await this.produtoRepo.find({
            relations: { categoria: true },
        });
    }

    async getByCodigo(codigo: string) {
        return await this.produtoRepo.findOne({
            where: { codigo },
            relations: { categoria: true },
        });
    }

    async createProduto(data: CreateProdutoDTO) {
        const codigoEmUso = await this.getByCodigo(data.codigo);
        if (codigoEmUso) {
            throw new AppError("Codigo de produto ja cadastrado!", 409);
        }

        let categoria: Categoria | null = null;
        if (data.categoriaId !== undefined) {
            categoria = await this.categoriaRepo.findOneBy({ id: data.categoriaId });
            if (!categoria) {
                throw new AppError("Categoria nao encontrada!", 404);
            }
        }

        const novoProdutoData = {
            nome: data.nome,
            descricao: data.descricao ?? null,
            codigo: data.codigo,
            preco: data.preco,
            estoque_atual: data.estoque_atual ?? 0,
            estoque_minimo: data.estoque_minimo,
            estoque_maximo: data.estoque_maximo ?? null,
            ativo: data.ativo ?? true,
            ...(categoria ? { categoria } : {}),
        };

        const novoProduto = this.produtoRepo.create(novoProdutoData);

        return await this.produtoRepo.save(novoProduto);
    }

    async updateProduto(id: string | number, data: UpdateProdutoDTO) {
        const produto = await this.getById(id);
        if (!produto) {
            throw new AppError("Produto nao encontrado!", 404);
        }

        if (data.codigo && data.codigo !== produto.codigo) {
            const codigoEmUso = await this.getByCodigo(data.codigo);
            if (codigoEmUso) {
                throw new AppError("Codigo de produto ja cadastrado!", 409);
            }
        }

        if (data.categoriaId !== undefined) {
            const categoria = await this.categoriaRepo.findOneBy({ id: data.categoriaId });
            if (!categoria) {
                throw new AppError("Categoria nao encontrada!", 404);
            }
            produto.categoria = categoria;
        }

        Object.assign(produto, {
            nome: data.nome ?? produto.nome,
            descricao: data.descricao ?? produto.descricao,
            codigo: data.codigo ?? produto.codigo,
            preco: data.preco ?? produto.preco,
            estoque_atual: data.estoque_atual ?? produto.estoque_atual,
            estoque_minimo: data.estoque_minimo ?? produto.estoque_minimo,
            estoque_maximo: data.estoque_maximo ?? produto.estoque_maximo,
            ativo: data.ativo ?? produto.ativo,
        });

        return await this.produtoRepo.save(produto);
    }

    async deleteProduto(id: string | number) {
        const result = await this.produtoRepo.delete(id as never);
        if (result.affected === 0) {
            throw new AppError("Produto nao encontrado!", 404);
        }
    }
}
