import type { EntityManager } from "typeorm";
import { DataSource, IsNull, Repository } from "typeorm";
import { Pedido } from "../entities/Pedido.js";
import { Cliente } from "../entities/Cliente.js";
import { Usuario } from "../entities/Usuario.js";
import { ItemPedido } from "../entities/ItemPedido.js";
import { Produto } from "../entities/Produto.js";
import { AppError } from "../errors/AppErrors.js";

/** Relações carregadas nas respostas de pedido (itens com produto para exibição). */
const pedidoDetailRelations = {
  cliente: true,
  usuario: true,
  itens: { produto: true },
} as const;

export class PedidoService {
  private dataSource: DataSource;
  private pedidoRepo: Repository<Pedido>;
  private clienteRepo: Repository<Cliente>;
  private usuarioRepo: Repository<Usuario>;
  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
    this.pedidoRepo = dataSource.getRepository(Pedido);
    this.clienteRepo = dataSource.getRepository(Cliente);
    this.usuarioRepo = dataSource.getRepository(Usuario);
  }

  private num(n: unknown): number {
    const x = Number(n);
    return Number.isFinite(x) ? x : 0;
  }

  private gerarCodigoPedido(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let codigo = "";
    for (let i = 0; i < 4; i += 1) {
      const idx = Math.floor(Math.random() * chars.length);
      codigo += chars[idx];
    }
    return codigo;
  }

  private async gerarCodigoPedidoUnico(em: EntityManager): Promise<string> {
    const pedidoRepo = em.getRepository(Pedido);
    const limiteTentativas = 20;

    for (let tentativa = 0; tentativa < limiteTentativas; tentativa += 1) {
      const codigo = this.gerarCodigoPedido();
      const existente = await pedidoRepo.existsBy({ codigo });
      if (!existente) return codigo;
    }

    throw new AppError("Não foi possível gerar código único para o pedido", 500);
  }

  async preencherCodigosPedidosExistentes(): Promise<void> {
    await this.dataSource.transaction(async (em) => {
      const pedidoRepo = em.getRepository(Pedido);
      const pedidosSemCodigo = await pedidoRepo.find({
        where: [{ codigo: IsNull() }, { codigo: "" }],
        select: { id: true, codigo: true },
      });

      for (const pedido of pedidosSemCodigo) {
        pedido.codigo = await this.gerarCodigoPedidoUnico(em);
        await pedidoRepo.save(pedido);
      }
    });
  }

  private totalFromItensPayload(itens: unknown): number | null {
    if (!Array.isArray(itens) || itens.length === 0) return null;
    let sum = 0;
    for (const it of itens) {
      if (it && typeof it === "object") {
        const o = it as Record<string, unknown>;
        sum += this.num(o.quantidade) * this.num(o.preco_unitario ?? o.preco);
      }
    }
    return sum;
  }

  private async ajustarEstoqueProduto(em: EntityManager, produtoId: string, delta: number): Promise<void> {
    const produtoRepo = em.getRepository(Produto);
    const produto = await produtoRepo.findOne({
      where: { id_prod: produtoId },
      lock: { mode: "pessimistic_write" },
    });
    if (!produto) throw new AppError("Produto não encontrado", 404);

    const atual = Math.trunc(this.num(produto.estoque_atual));
    const novo = atual + delta;
    if (novo < 0) {
      throw new AppError("Estoque insuficiente para concluir a operação", 400);
    }
    produto.estoque_atual = novo;
    await produtoRepo.save(produto);
  }

  private async baixarEstoqueItensPedido(em: EntityManager, itens: ItemPedido[]): Promise<void> {
    for (const line of itens) {
      const produtoId = line.produto?.id_prod;
      if (!produtoId) continue;
      await this.ajustarEstoqueProduto(em, produtoId, -line.quantidade);
    }
  }

  private async restaurarEstoqueItensPedido(em: EntityManager, itens: ItemPedido[]): Promise<void> {
    for (const line of itens) {
      const produtoId = line.produto?.id_prod;
      if (!produtoId) continue;
      await this.ajustarEstoqueProduto(em, produtoId, line.quantidade);
    }
  }

  async create(data: any) {
    return await this.dataSource.transaction(async (em) => {
      const clienteRepo = em.getRepository(Cliente);
      const usuarioRepo = em.getRepository(Usuario);
      const pedidoRepo = em.getRepository(Pedido);

      const cliente = await clienteRepo.findOneBy({ id: data.clienteId });
      if (!cliente) throw new AppError("Cliente não encontrado", 404);

      const usuario = await usuarioRepo.findOneBy({ id_user: data.usuarioId });
      if (!usuario) throw new AppError("Usuário não encontrado", 404);

      const fromItens = this.totalFromItensPayload(data.itens);
      const total = fromItens !== null ? fromItens : this.num(data.total);

      const pedido = pedidoRepo.create({
        codigo: await this.gerarCodigoPedidoUnico(em),
        cliente,
        usuario,
        total,
        status: data.status ?? "aberto",
        itens: data.itens,
      });

      const saved = await pedidoRepo.save(pedido);

      if (saved.status === "pago") {
        const fullItens = await em.find(ItemPedido, {
          where: { pedido: { id: saved.id } },
          relations: { produto: true },
        });
        if (fullItens.length > 0) {
          await this.baixarEstoqueItensPedido(em, fullItens);
        }
      }

      const result = await pedidoRepo.findOne({
        where: { id: saved.id },
        relations: pedidoDetailRelations,
      });
      if (!result) throw new AppError("Pedido não encontrado após criação", 500);
      return result;
    });
  }

  async findAll() {
    return await this.pedidoRepo.find({
      relations: pedidoDetailRelations,
      order: {
        created_at: "DESC",
      },
    });
  }

  async findById(id: string) {
    const pedido = await this.pedidoRepo.findOne({
      where: { id },
      relations: pedidoDetailRelations,
    });

    if (!pedido) throw new AppError("Pedido não encontrado", 404);

    return pedido;
  }

  async updateStatus(id: string, status: string) {
    if (!["aberto", "pago", "cancelado"].includes(status)) {
      throw new AppError("Status inválido", 400);
    }

    return await this.dataSource.transaction(async (em) => {
      const pedidoRepo = em.getRepository(Pedido);
      const pedido = await pedidoRepo.findOne({
        where: { id },
        relations: { itens: { produto: true } },
        lock: { mode: "pessimistic_write" },
      });
      if (!pedido) throw new AppError("Pedido não encontrado", 404);

      const anterior = pedido.status;
      if (anterior === status) {
        const unchanged = await pedidoRepo.findOne({
          where: { id },
          relations: pedidoDetailRelations,
        });
        if (!unchanged) throw new AppError("Pedido não encontrado", 404);
        return unchanged;
      }

      if (anterior === "cancelado") {
        throw new AppError("Pedido cancelado não pode ter status alterado", 400);
      }

      if (anterior === "aberto" && status === "pago") {
        await this.baixarEstoqueItensPedido(em, pedido.itens ?? []);
      } else if (anterior === "pago" && (status === "aberto" || status === "cancelado")) {
        await this.restaurarEstoqueItensPedido(em, pedido.itens ?? []);
      }

      pedido.status = status;
      await pedidoRepo.save(pedido);

      const atualizado = await pedidoRepo.findOne({
        where: { id },
        relations: pedidoDetailRelations,
      });
      if (!atualizado) throw new AppError("Pedido não encontrado", 404);
      return atualizado;
    });
  }

  async delete(id: string) {
    await this.dataSource.transaction(async (em) => {
      const pedidoRepo = em.getRepository(Pedido);
      const pedido = await pedidoRepo.findOne({
        where: { id },
        relations: { itens: { produto: true } },
        lock: { mode: "pessimistic_write" },
      });
      if (!pedido) throw new AppError("Pedido não encontrado", 404);

      if (pedido.status === "pago") {
        await this.restaurarEstoqueItensPedido(em, pedido.itens ?? []);
      }

      await pedidoRepo.remove(pedido);
    });
  }
}