import type { DataSource, Repository } from "typeorm";
import { Categoria } from "../entities/Categoria.js";
import { AppError } from "../errors/AppErrors.js";

export type CreateCategoriaDTO = {
    nome: string;
    descricao?: string;
    status?: boolean;
    ativo?: boolean;
};

export type UpdateCategoriaDTO = Partial<CreateCategoriaDTO>;

export class CategoriaService {
    private categoriaRepo: Repository<Categoria>;

    constructor(dataSource: DataSource) {
        this.categoriaRepo = dataSource.getRepository(Categoria);
    }

    async getById(id: string | number) {
        return await this.categoriaRepo.findOne({
            where: {id: id as never },
            relations: { produtos: true },
        });
    }

    async findAll() {
        return await this.categoriaRepo.find({
            relations: { produtos: true },
            order: { nome: "ASC" },
        });
    }

    async getByNome(nome: string) {
        return await this.categoriaRepo.findOne({
            where: { nome },
            relations: { produtos: true },
        });
    }

    async createCategoria(data: CreateCategoriaDTO) {
        const existente = await this.getByNome(data.nome);
        if (existente) {
            throw new AppError("Categoria ja cadastrada!", 409);
        }

        const categoria = this.categoriaRepo.create({
            nome: data.nome,
            ...(data.descricao !== undefined ? { descricao: data.descricao } : {}),
            ...(data.status !== undefined ? { status: data.status } : {}),
            ...(data.status === undefined && data.ativo !== undefined ? { status: data.ativo } : {}),
        });

        return await this.categoriaRepo.save(categoria);
    }

    async updateCategoria(id: string, data: UpdateCategoriaDTO) {
        const categoria = await this.getById(id);

        if (!categoria) {
            throw new AppError("Categoria nao encontrada!", 404);
        }

        if (data.nome && data.nome !== categoria.nome) {
            const existente = await this.getByNome(data.nome);
            if (existente) {
                throw new AppError("Categoria ja cadastrada!", 409);
            }
        }

        Object.assign(categoria, {
            nome: data.nome ?? categoria.nome,
            ...(data.descricao !== undefined ? { descricao: data.descricao } : {}),
            ...(data.status !== undefined ? { status: data.status } : {}),
            ...(data.status === undefined && data.ativo !== undefined ? { status: data.ativo } : {}),
        });

        return await this.categoriaRepo.save(categoria);
    }

    async deleteCategoria(id: string) {
        const categoria = await this.categoriaRepo.findOneBy({ id });

        if (!categoria) {
            throw new AppError("Categoria não encontrada", 404);
        }

        await this.categoriaRepo.delete(id);
    }
}

