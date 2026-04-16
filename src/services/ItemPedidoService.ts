import type { EntityManager } from "typeorm";
import { DataSource, Repository } from "typeorm";
import { ItemPedido } from "../entities/ItemPedido.js";
import { Pedido } from "../entities/Pedido.js";
import { Produto } from "../entities/Produto.js";
import { AppError } from "../errors/AppErrors.js";
import type { CreateItemPedidoDTO, UpdateItemPedidoDTO } from "../dtos/ItemPedidoDTO.js";

export class ItemPedidoService {
  private dataSource: DataSource;
  private itemRepo: Repository<ItemPedido>;
  private pedidoRepo: Repository<Pedido>;
  private produtoRepo: Repository<Produto>;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
    this.itemRepo = dataSource.getRepository(ItemPedido);
    this.pedidoRepo = dataSource.getRepository(Pedido);
    this.produtoRepo = dataSource.getRepository(Produto);
  }

  private num(n: unknown): number {
    const x = Number(n);
    return Number.isFinite(x) ? x : 0;
  }

  private async recalcularTotalPedido(em: EntityManager, pedidoId: string): Promise<void> {
    const itens = await em.find(ItemPedido, { where: { pedido: { id: pedidoId } } });
    const total = itens.reduce(
      (sum, i) => sum + this.num(i.quantidade) * this.num(i.preco_unitario),
      0
    );
    await em.update(Pedido, { id: pedidoId }, { total });
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

  private ensurePedidoEditavel(pedido: Pedido): void {
    if (pedido.status === "cancelado") {
      throw new AppError("Pedido cancelado não pode ser alterado", 400);
    }
  }

  async create(data: CreateItemPedidoDTO) {
    return await this.dataSource.transaction(async (em) => {
      const pedido = await em.findOne(Pedido, { where: { id: data.pedidoId } });
      if (!pedido) throw new AppError("Pedido não encontrado", 404);
      this.ensurePedidoEditavel(pedido);

      const produto = await em.findOne(Produto, { where: { id_prod: data.produtoId } });
      if (!produto) throw new AppError("Produto não encontrado", 404);

      const item = em.create(ItemPedido, {
        pedido,
        produto,
        quantidade: data.quantidade,
        preco_unitario: data.preco_unitario,
      });
      const saved = await em.save(item);

      if (pedido.status === "pago") {
        await this.ajustarEstoqueProduto(em, produto.id_prod, -data.quantidade);
      }

      await this.recalcularTotalPedido(em, pedido.id);

      const comRelacoes = await em.findOne(ItemPedido, {
        where: { id: saved.id },
        relations: { pedido: true, produto: { categoria: true } },
      });
      if (!comRelacoes) throw new AppError("Item do pedido não encontrado após criação", 500);
      return comRelacoes;
    });
  }

  async findAll(pedidoId?: string) {
    return await this.itemRepo.find({
      ...(pedidoId ? { where: { pedido: { id: pedidoId } } } : {}),
      relations: { pedido: true, produto: { categoria: true } },
      order: { id: "ASC" },
    });
  }

  async findById(id: number) {
    const item = await this.itemRepo.findOne({
      where: { id },
      relations: { pedido: true, produto: { categoria: true } },
    });
    if (!item) throw new AppError("Item do pedido não encontrado", 404);
    return item;
  }

  async update(id: number, data: UpdateItemPedidoDTO) {
    return await this.dataSource.transaction(async (em) => {
      const item = await em.findOne(ItemPedido, {
        where: { id },
        relations: { pedido: true, produto: { categoria: true } },
        lock: { mode: "pessimistic_write" },
      });
      if (!item) throw new AppError("Item do pedido não encontrado", 404);

      this.ensurePedidoEditavel(item.pedido);

      const oldPedidoId = item.pedido.id;
      const oldPedidoPago = item.pedido.status === "pago";
      const oldProdutoId = item.produto.id_prod;
      const oldQuantidade = item.quantidade;

      if (data.pedidoId !== undefined) {
        const pedido = await em.findOne(Pedido, { where: { id: data.pedidoId } });
        if (!pedido) throw new AppError("Pedido não encontrado", 404);
        this.ensurePedidoEditavel(pedido);
        item.pedido = pedido;
      }

      if (data.produtoId !== undefined) {
        const produto = await em.findOne(Produto, { where: { id_prod: data.produtoId } });
        if (!produto) throw new AppError("Produto não encontrado", 404);
        item.produto = produto;
      }

      if (data.quantidade !== undefined) item.quantidade = data.quantidade;
      if (data.preco_unitario !== undefined) item.preco_unitario = data.preco_unitario;

      const newPedidoPago = item.pedido.status === "pago";
      const newProdutoId = item.produto.id_prod;
      const newQuantidade = item.quantidade;

      if (oldPedidoPago && !newPedidoPago) {
        await this.ajustarEstoqueProduto(em, oldProdutoId, oldQuantidade);
      } else if (!oldPedidoPago && newPedidoPago) {
        await this.ajustarEstoqueProduto(em, newProdutoId, -newQuantidade);
      } else if (oldPedidoPago && newPedidoPago) {
        if (oldPedidoId !== item.pedido.id) {
          await this.ajustarEstoqueProduto(em, oldProdutoId, oldQuantidade);
          await this.ajustarEstoqueProduto(em, newProdutoId, -newQuantidade);
        } else if (oldProdutoId !== newProdutoId) {
          await this.ajustarEstoqueProduto(em, oldProdutoId, oldQuantidade);
          await this.ajustarEstoqueProduto(em, newProdutoId, -newQuantidade);
        } else {
          const deltaQty = newQuantidade - oldQuantidade;
          if (deltaQty !== 0) {
            await this.ajustarEstoqueProduto(em, newProdutoId, -deltaQty);
          }
        }
      }

      await em.save(item);
      await this.recalcularTotalPedido(em, oldPedidoId);
      if (oldPedidoId !== item.pedido.id) {
        await this.recalcularTotalPedido(em, item.pedido.id);
      }

      const atualizado = await em.findOne(ItemPedido, {
        where: { id: item.id },
        relations: { pedido: true, produto: { categoria: true } },
      });
      if (!atualizado) throw new AppError("Item do pedido não encontrado após atualização", 500);
      return atualizado;
    });
  }

  async delete(id: number) {
    await this.dataSource.transaction(async (em) => {
      const item = await em.findOne(ItemPedido, {
        where: { id },
        relations: { pedido: true, produto: true },
        lock: { mode: "pessimistic_write" },
      });
      if (!item) throw new AppError("Item do pedido não encontrado", 404);

      this.ensurePedidoEditavel(item.pedido);

      const pedidoId = item.pedido.id;
      if (item.pedido.status === "pago") {
        await this.ajustarEstoqueProduto(em, item.produto.id_prod, item.quantidade);
      }

      await em.remove(item);
      await this.recalcularTotalPedido(em, pedidoId);
    });
  }
}
