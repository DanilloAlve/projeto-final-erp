import { DataSource, Repository } from "typeorm";
import { Pedido } from "../entities/Pedido.js";
import { Cliente } from "../entities/Cliente.js";
import { Usuario } from "../entities/Usuario.js";
import { AppError } from "../errors/AppErrors.js";

export class PedidoService {
  private pedidoRepo: Repository<Pedido>;
  private clienteRepo: Repository<Cliente>;
  private usuarioRepo: Repository<Usuario>;

  constructor(dataSource: DataSource) {
    this.pedidoRepo = dataSource.getRepository(Pedido);
    this.clienteRepo = dataSource.getRepository(Cliente);
    this.usuarioRepo = dataSource.getRepository(Usuario);
  }

  async create(data: any) {
    const cliente = await this.clienteRepo.findOneBy({ id: data.clienteId });
    if (!cliente) throw new AppError("Cliente não encontrado", 404);

    const usuario = await this.usuarioRepo.findOneBy({ id_user: data.usuarioId });
    if (!usuario) throw new AppError("Usuário não encontrado", 404);

    const pedido = this.pedidoRepo.create({
      cliente,
      usuario,
      total: data.total,
      status: data.status ?? "aberto",
      itens: data.itens,
    });

    return await this.pedidoRepo.save(pedido);
  }

  async findAll() {
    return await this.pedidoRepo.find({
      relations: ["cliente", "usuario", "itens"],
    });
  }

  async findById(id: string) {
    const pedido = await this.pedidoRepo.findOne({
      where: { id },
      relations: ["cliente", "usuario", "itens"],
    });

    if (!pedido) throw new AppError("Pedido não encontrado", 404);

    return pedido;
  }

  async updateStatus(id: string, status: string) {
    const pedido = await this.findById(id);

    pedido.status = status;

    return await this.pedidoRepo.save(pedido);
  }

  async delete(id: string) {
    const result = await this.pedidoRepo.delete(id);

    if (result.affected === 0) {
      throw new AppError("Pedido não encontrado", 404);
    }
  }
}