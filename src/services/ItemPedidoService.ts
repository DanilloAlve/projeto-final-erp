import { DataSource, Repository } from "typeorm";
import { ItemPedido } from "../entities/ItemPedido.js";
import { Pedido } from "../entities/Pedido.js";
import { Produto } from "../entities/Produto.js";
import { AppError } from "../errors/AppErrors.js";
import type { CreateItemPedidoDTO, UpdateItemPedidoDTO } from "../dtos/ItemPedidoDTO.js";

export class ItemPedidoService {
  private itemRepo: Repository<ItemPedido>;
  private pedidoRepo: Repository<Pedido>;
  private produtoRepo: Repository<Produto>;

  constructor(dataSource: DataSource) {
    this.itemRepo = dataSource.getRepository(ItemPedido);
    this.pedidoRepo = dataSource.getRepository(Pedido);
    this.produtoRepo = dataSource.getRepository(Produto);
  }

  async create(data: CreateItemPedidoDTO) {
    const pedido = await this.pedidoRepo.findOneBy({ id: data.pedidoId });
    if (!pedido) throw new AppError("Pedido não encontrado", 404);

    const produto = await this.produtoRepo.findOneBy({ id_prod: data.produtoId });
    if (!produto) throw new AppError("Produto não encontrado", 404);

    const item = this.itemRepo.create({
      pedido,
      produto,
      quantidade: data.quantidade,
      preco_unitario: data.preco_unitario,
    });

    return await this.itemRepo.save(item);
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
    const item = await this.findById(id);

    if (data.pedidoId !== undefined) {
      const pedido = await this.pedidoRepo.findOneBy({ id: data.pedidoId });
      if (!pedido) throw new AppError("Pedido não encontrado", 404);
      item.pedido = pedido;
    }

    if (data.produtoId !== undefined) {
      const produto = await this.produtoRepo.findOneBy({ id_prod: data.produtoId });
      if (!produto) throw new AppError("Produto não encontrado", 404);
      item.produto = produto;
    }

    if (data.quantidade !== undefined) item.quantidade = data.quantidade;
    if (data.preco_unitario !== undefined) item.preco_unitario = data.preco_unitario;

    return await this.itemRepo.save(item);
  }

  async delete(id: number) {
    const result = await this.itemRepo.delete(id);
    if (result.affected === 0) {
      throw new AppError("Item do pedido não encontrado", 404);
    }
  }
}
