import type { DataSource, Repository } from "typeorm";
import { Produto, Categoria, Usuario } from "../entities/core.entities.js";
import { MovimentacaoEstoque, MotivoMovimentacao, TipoMovimentacao } from "../entities/Movimentacao.js";
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
    private dataSource: DataSource;
    private produtoRepo: Repository<Produto>;
    private categoriaRepo: Repository<Categoria>;

    constructor(dataSource: DataSource) {
        this.dataSource = dataSource;
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

    async createProduto(data: CreateProdutoDTO, usuarioId?: string) {
        return await this.dataSource.transaction(async (manager) => {
            const produtoRepo = manager.getRepository(Produto);
            const categoriaRepo = manager.getRepository(Categoria);
            const usuarioRepo = manager.getRepository(Usuario);
            const movimentacaoRepo = manager.getRepository(MovimentacaoEstoque);

            const produtoExistenteMesmoNome = await produtoRepo.findOne({
                where: { nome: data.nome } as any,
                relations: { categoria: true },
                lock: { mode: "pessimistic_write" },
            });

            if (produtoExistenteMesmoNome) {
                const quantidadeEntrada = Number(data.estoque_atual ?? 1);
                if (!quantidadeEntrada || quantidadeEntrada <= 0) {
                    throw new AppError("Quantidade inválida", 400);
                }

                if (data.categoriaId !== undefined) {
                    const categoria = await categoriaRepo.findOneBy({ id: data.categoriaId });
                    if (!categoria) {
                        throw new AppError("Categoria nao encontrada!", 404);
                    }
                    produtoExistenteMesmoNome.categoria = categoria;
                }

                Object.assign(produtoExistenteMesmoNome, {
                    descricao: data.descricao ?? produtoExistenteMesmoNome.descricao,
                    preco: data.preco ?? produtoExistenteMesmoNome.preco,
                    estoque_minimo: data.estoque_minimo ?? produtoExistenteMesmoNome.estoque_minimo,
                    estoque_maximo: data.estoque_maximo ?? produtoExistenteMesmoNome.estoque_maximo,
                    ativo: data.ativo ?? produtoExistenteMesmoNome.ativo,
                });

                produtoExistenteMesmoNome.estoque_atual = Number(produtoExistenteMesmoNome.estoque_atual ?? 0) + quantidadeEntrada;

                const produtoAtualizado = await produtoRepo.save(produtoExistenteMesmoNome);

                if (usuarioId) {
                    const usuario = await usuarioRepo.findOneBy({ id_user: usuarioId });
                    if (usuario) {
                        const mov = movimentacaoRepo.create({
                            produto: produtoAtualizado,
                            usuario,
                            tipo: TipoMovimentacao.ENTRADA,
                            quantidade: quantidadeEntrada,
                            motivo: MotivoMovimentacao.AJUSTE,
                            observacao: "Cadastro de produto (já existente - somado no estoque)",
                        });
                        await movimentacaoRepo.save(mov);
                    }
                }

                return produtoAtualizado;
            }

            const codigoEmUso = await produtoRepo.findOne({ where: { codigo: data.codigo } as any, relations: { categoria: true } });
            if (codigoEmUso) {
                throw new AppError("Codigo de produto ja cadastrado!", 409);
            }

            let categoria: Categoria | null = null;
            if (data.categoriaId !== undefined) {
                categoria = await categoriaRepo.findOneBy({ id: data.categoriaId });
                if (!categoria) {
                    throw new AppError("Categoria nao encontrada!", 404);
                }
            }

            const estoqueInicial = data.estoque_atual === undefined ? 1 : Number(data.estoque_atual ?? 0);
            if (!estoqueInicial || estoqueInicial <= 0) {
                throw new AppError("Quantidade inválida", 400);
            }
            const novoProdutoData = {
                nome: data.nome,
                descricao: data.descricao ?? null,
                codigo: data.codigo,
                preco: data.preco,
                estoque_atual: estoqueInicial,
                estoque_minimo: data.estoque_minimo,
                estoque_maximo: data.estoque_maximo ?? null,
                ativo: data.ativo ?? true,
                ...(categoria ? { categoria } : {}),
            };

            const novoProduto = produtoRepo.create(novoProdutoData);
            const produtoSalvo = await produtoRepo.save(novoProduto);

            if (usuarioId) {
                const usuario = await usuarioRepo.findOneBy({ id_user: usuarioId });
                if (usuario) {
                    const mov = movimentacaoRepo.create({
                        produto: produtoSalvo,
                        usuario,
                        tipo: TipoMovimentacao.ENTRADA,
                        quantidade: estoqueInicial,
                        motivo: MotivoMovimentacao.AJUSTE,
                        observacao: "Cadastro de produto",
                    });
                    await movimentacaoRepo.save(mov);
                }
            }

            return produtoSalvo;
        });
    }

    async updateProduto(id: string | number, data: UpdateProdutoDTO, usuarioId?: string) {
        return await this.dataSource.transaction(async (manager) => {
            const produtoRepo = manager.getRepository(Produto);
            const categoriaRepo = manager.getRepository(Categoria);
            const usuarioRepo = manager.getRepository(Usuario);
            const movimentacaoRepo = manager.getRepository(MovimentacaoEstoque);

            const produto = await produtoRepo.findOne({
                where: { id_prod: id as never },
                relations: { categoria: true },
                lock: { mode: "pessimistic_write" },
            });

            if (!produto) {
                throw new AppError("Produto nao encontrado!", 404);
            }

            if (data.codigo && data.codigo !== produto.codigo) {
                const codigoEmUso = await produtoRepo.findOne({ where: { codigo: data.codigo } as any, relations: { categoria: true } });
                if (codigoEmUso) {
                    throw new AppError("Codigo de produto ja cadastrado!", 409);
                }
            }

            if (data.categoriaId !== undefined) {
                const categoria = await categoriaRepo.findOneBy({ id: data.categoriaId });
                if (!categoria) {
                    throw new AppError("Categoria nao encontrada!", 404);
                }
                produto.categoria = categoria;
            }

            const estoqueAntes = Number(produto.estoque_atual ?? 0);

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

            const produtoSalvo = await produtoRepo.save(produto);

            if (usuarioId && data.estoque_atual !== undefined) {
                const estoqueDepois = Number(produtoSalvo.estoque_atual ?? 0);
                const delta = estoqueDepois - estoqueAntes;
                if (delta !== 0) {
                    const usuario = await usuarioRepo.findOneBy({ id_user: usuarioId });
                    if (usuario) {
                        const mov = movimentacaoRepo.create({
                            produto: produtoSalvo,
                            usuario,
                            tipo: delta > 0 ? TipoMovimentacao.ENTRADA : TipoMovimentacao.SAIDA,
                            quantidade: Math.abs(delta),
                            motivo: MotivoMovimentacao.AJUSTE,
                            observacao: "Ajuste de estoque via edição de produto",
                        });
                        await movimentacaoRepo.save(mov);
                    }
                }
            }

            return produtoSalvo;
        });
    }

    async deleteProduto(id: string | number) {
        const result = await this.produtoRepo.delete(id as never);
        if (result.affected === 0) {
            throw new AppError("Produto nao encontrado!", 404);
        }
    }
}
