import type { DataSource, Repository } from "typeorm";
import { Categoria } from "../entities/Categoria.js";
import { AppError } from "../errors/AppErrors.js";

export type CreateCategoriaDTO = {
    nome: string;
    descricao?: string;
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
        });

        return await this.categoriaRepo.save(categoria);
    }

    async updateCategoria(id: number, data: UpdateCategoriaDTO) {
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
        });

        return await this.categoriaRepo.save(categoria);
    }

    async deleteCategoria(id: number) {
        const result = await this.categoriaRepo.delete(id);
        if (result.affected === 0) {
            throw new AppError("Categoria nao encontrada!", 404);
        }
    }
}

