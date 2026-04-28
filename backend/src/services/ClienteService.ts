import { appDataSource } from "../database/appDataSource.js";
import { Cliente } from "../entities/Cliente.js";

export class ClienteService {
private clienteRepository = appDataSource.getRepository(Cliente);

private normalizarCpfCnpj(valor: string): string {
const apenasDigitos = valor.replace(/\D/g, "");
if (apenasDigitos.length === 11) {
    if (!this.isCpfValido(apenasDigitos)) {
    throw new Error("CPF inválido.");
    }
    return apenasDigitos;
}
if (apenasDigitos.length === 14) {
    if (!this.isCnpjValido(apenasDigitos)) {
    throw new Error("CNPJ inválido.");
    }
    return apenasDigitos;
}
throw new Error("CPF/CNPJ deve conter 11 ou 14 dígitos.");
}

private isCpfValido(cpf: string): boolean {
if (!/^\d{11}$/.test(cpf)) return false;
if (/^(\d)\1{10}$/.test(cpf)) return false;

const calcularDigito = (base: string, pesoInicial: number): number => {
    let soma = 0;
    for (let i = 0; i < base.length; i += 1) {
    soma += Number(base.charAt(i)) * (pesoInicial - i);
    }
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
};

const digito1 = calcularDigito(cpf.slice(0, 9), 10);
const digito2 = calcularDigito(cpf.slice(0, 10), 11);
return digito1 === Number(cpf[9]) && digito2 === Number(cpf[10]);
}

private isCnpjValido(cnpj: string): boolean {
if (!/^\d{14}$/.test(cnpj)) return false;
if (/^(\d)\1{13}$/.test(cnpj)) return false;

const calcularDigito = (base: string, pesos: number[]): number => {
    const soma = base
    .split("")
    .reduce((acc, digito, index) => acc + Number(digito) * (pesos[index] ?? 0), 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
};

const digito1 = calcularDigito(cnpj.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
const digito2 = calcularDigito(cnpj.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
return digito1 === Number(cnpj[12]) && digito2 === Number(cnpj[13]);
}

private async existeCpfCnpjDuplicado(cpfCnpjNormalizado: string, ignorarId?: number): Promise<boolean> {
const clientes = await this.clienteRepository.find({
    select: {
    id: true,
    cpf_cnpj: true
    }
});

return clientes.some((cliente) => {
    if (ignorarId && cliente.id === ignorarId) return false;
    const cpfCnpjExistenteNormalizado = (cliente.cpf_cnpj ?? "").replace(/\D/g, "");
    return cpfCnpjExistenteNormalizado === cpfCnpjNormalizado;
});
}

async create(data: Partial<Cliente>): Promise<Cliente> {
if (!data.nome) {
    throw new Error("Nome é obrigatório.");
}
if (!data.cpf_cnpj) {
    throw new Error("CPF/CNPJ é obrigatório.");
}
const cpfCnpjNormalizado = this.normalizarCpfCnpj(data.cpf_cnpj);

const clienteExistente = await this.existeCpfCnpjDuplicado(cpfCnpjNormalizado);

if (clienteExistente) {
    throw new Error("Já existe um cliente com esse CPF/CNPJ.");
}

const cliente = this.clienteRepository.create({
    nome: data.nome,
    cpf_cnpj: cpfCnpjNormalizado,
    ...(data.email !== undefined ? { email: data.email } : {}),
    ...(data.telefone !== undefined ? { telefone: data.telefone } : {})
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

if (data.cpf_cnpj) {
    data.cpf_cnpj = this.normalizarCpfCnpj(data.cpf_cnpj);
}

if (data.cpf_cnpj && data.cpf_cnpj !== cliente.cpf_cnpj) {
    const cpfCnpjExistente = await this.existeCpfCnpjDuplicado(data.cpf_cnpj, id);

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