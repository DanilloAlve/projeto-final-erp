import { QueryFailedError, type DataSource, type Repository } from "typeorm";
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

type ListProdutosParams = {
    page: number;
    limit: number;
    nome?: string;
    estoque?: "todos" | "em-estoque" | "fora-de-estoque";
};

type PaginatedProdutosResult = {
    data: Produto[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
};

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

    async findAll(params: ListProdutosParams): Promise<PaginatedProdutosResult> {
        const query = this.produtoRepo
            .createQueryBuilder("produto")
            .leftJoinAndSelect("produto.categoria", "categoria")
            .orderBy("produto.created_at", "DESC");

        if (params.nome) {
            query.andWhere("LOWER(produto.nome) LIKE :nome", {
                nome: `%${params.nome.toLowerCase()}%`,
            });
        }

        if (params.estoque === "em-estoque") {
            query.andWhere("produto.estoque_atual > 0");
        }

        if (params.estoque === "fora-de-estoque") {
            query.andWhere("produto.estoque_atual <= 0");
        }

        const page = Math.max(1, params.page);
        const limit = Math.max(1, params.limit);
        query.take(limit);

        const [firstPageData, total] = await query.getManyAndCount();
        const totalPages = Math.max(1, Math.ceil(total / limit));
        const safePage = Math.min(page, totalPages);
        const skip = (safePage - 1) * limit;

        let data = firstPageData;
        if (skip > 0) {
            data = await query.clone().skip(skip).getMany();
        }

        return {
            data,
            page: safePage,
            limit,
            total,
            totalPages,
        };
    }

    async findAllList() {
        return await this.produtoRepo.find({
            relations: { categoria: true },
            order: { created_at: "DESC" },
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

        this.validateEstoqueLimites(
            novoProdutoData.estoque_atual,
            novoProdutoData.estoque_minimo,
            novoProdutoData.estoque_maximo
        );

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

        this.validateEstoqueLimites(
            produto.estoque_atual,
            produto.estoque_minimo,
            produto.estoque_maximo
        );

        return await this.produtoRepo.save(produto);
    }

    async deleteProduto(id: string | number) {
        try {
            const result = await this.produtoRepo.delete(id as never);
            if (result.affected === 0) {
                throw new AppError("Produto nao encontrado!", 404);
            }
        } catch (error) {
            if (this.isForeignKeyConstraintError(error)) {
                throw new AppError(
                    "Produto nao pode ser excluido pois possui registros vinculados.",
                    409
                );
            }
            throw error;
        }
    }

    private isForeignKeyConstraintError(error: unknown) {
        if (!(error instanceof QueryFailedError)) {
            return false;
        }

        const driverError = error.driverError as { code?: string; errno?: number } | undefined;
        return driverError?.code === "ER_ROW_IS_REFERENCED_2" || driverError?.errno === 1451;
    }

    private validateEstoqueLimites(
        estoqueAtual: number,
        estoqueMinimo: number,
        estoqueMaximo: number | null
    ) {
        if (estoqueAtual < estoqueMinimo) {
            throw new AppError("Estoque atual nao pode ser menor que o estoque minimo.", 422);
        }

        if (estoqueMaximo !== null && estoqueAtual > estoqueMaximo) {
            throw new AppError("Estoque atual nao pode ser maior que o estoque maximo.", 422);
        }
    }
}
