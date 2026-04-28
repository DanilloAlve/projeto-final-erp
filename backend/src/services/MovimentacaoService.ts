import z from "zod";
import { appDataSource } from "../database/appDataSource.js";
import { MovimentacaoEstoque, TipoMovimentacao, MotivoMovimentacao,} from "../entities/Movimentacao.js";
import { Produto } from "../entities/Produto.js";
import { Usuario } from "../entities/Usuario.js";
import { AppError } from "../errors/AppErrors.js";

export class MovimentacaoEstoqueService {
  async create(data: {
    produtoId: string;
    usuarioId: string;
    tipo: TipoMovimentacao;
    quantidade: number;
    motivo: MotivoMovimentacao;
    observacao?: string;
  }) {
    return await appDataSource.transaction(async (manager) => {
      const produtoRepo = manager.getRepository(Produto);
      const usuarioRepo = manager.getRepository(Usuario);
      const movimentacaoRepo = manager.getRepository(MovimentacaoEstoque);

      // 🔍 Validação básica
      if (data.quantidade <= 0) {
        throw new AppError("Quantidade deve ser maior que zero", 400);
      }

      const produto = await produtoRepo.findOne({
        where: { id_prod: data.produtoId },
        lock: { mode: "pessimistic_write" }, //evita concorrência
      });

      if (!produto) {
        throw new AppError("Produto não encontrado", 404);
      }

      const usuario = await usuarioRepo.findOneBy({
        id_user: data.usuarioId,
      });

      if (!usuario) {
        throw new AppError("Usuário não encontrado", 404);
      }
      
      if (data.tipo === TipoMovimentacao.SAIDA) {
        if (produto.estoque_atual < data.quantidade) {
          throw new AppError(
            `Estoque insuficiente. Disponível: ${produto.estoque_atual}`,
            400
          );
        }

        produto.estoque_atual -= data.quantidade;
      } else {
        produto.estoque_atual += data.quantidade;
      }

      await produtoRepo.save(produto);

      const movimentacao = movimentacaoRepo.create({
        produto,
        usuario,
        tipo: data.tipo,
        quantidade: data.quantidade,
        motivo: data.motivo, // agora tipado corretamente
        ...(data.observacao && { observacao: data.observacao }),
      });

      return await movimentacaoRepo.save(movimentacao);
    });
  }

  async findAll() {
    return await appDataSource.getRepository(MovimentacaoEstoque).find({
      relations: ["produto", "usuario"],
      order: { created_at: "DESC" }, 
    });
  }

  async findById(id: string) {
    if (!id) {
      throw new AppError("ID inválido", 400);
    }

    const mov = await appDataSource
      .getRepository(MovimentacaoEstoque)
      .findOne({
        where: { id },
        relations: ["produto", "usuario"],
      });

    if (!mov) {
      throw new AppError("Movimentação não encontrada", 404);
    }

    return mov;
  }

    async delete(id: string) {
    const repo = appDataSource.getRepository(MovimentacaoEstoque);

    const mov = await repo.findOneBy({ id });

    if (!mov) {
        throw new AppError("Movimentação não encontrada", 404);
    }

    await repo.remove(mov);
    }  
}