import { appDataSource } from "../database/appDataSource.js";
import { Cliente } from "../entities/core.entities.js";

export class ClienteService {
private clienteRepository = appDataSource.getRepository(Cliente);

async create(data: Partial<Cliente>): Promise<Cliente> {
  const { nome, cpf_cnpj } = data;
  if (!nome || !cpf_cnpj) {
    throw new Error("Nome e CPF/CNPJ são obrigatórios.");
  }

  const clienteExistente = await this.clienteRepository.findOne({
    where: { cpf_cnpj },
  });

  if (clienteExistente) {
    throw new Error("Já existe um cliente com esse CPF/CNPJ.");
  }

  const cliente = this.clienteRepository.create({
    nome,
    cpf_cnpj,
    ...(data.email !== undefined ? { email: data.email } : {}),
    ...(data.telefone !== undefined ? { telefone: data.telefone } : {}),
  });

  return await this.clienteRepository.save(cliente);
}

async findAll(): Promise<Cliente[]> {
return await this.clienteRepository.find({
    relations: ["pedidos"]
});
}

async findById(id: number): Promise<Cliente> {
const cliente = await this.clienteRepository.findOne({
    where: { id },
    relations: ["pedidos"]
});

if (!cliente) {
    throw new Error("Cliente não encontrado.");
}

return cliente;
}

async update(id: number, data: Partial<Cliente>): Promise<Cliente> {
const cliente = await this.clienteRepository.findOne({
    where: { id }
});

if (!cliente) {
    throw new Error("Cliente não encontrado.");
}

if (data.cpf_cnpj && data.cpf_cnpj !== cliente.cpf_cnpj) {
    const cpfCnpjExistente = await this.clienteRepository.findOne({
    where: { cpf_cnpj: data.cpf_cnpj }
    });

    if (cpfCnpjExistente) {
    throw new Error("Já existe outro cliente com esse CPF/CNPJ.");
    }
}

this.clienteRepository.merge(cliente, data);

return await this.clienteRepository.save(cliente);
}

async delete(id: number): Promise<void> {
const cliente = await this.clienteRepository.findOne({
    where: { id }
});

if (!cliente) {
    throw new Error("Cliente não encontrado.");
}

await this.clienteRepository.remove(cliente);
}
}