import { appDataSource } from "../database/appDataSource.js";
import { Financeiro } from "../entities/Financeiro.js";

export class FinanceiroService {
private financeiroRepository = appDataSource.getRepository(Financeiro);

async create(data: Partial<Financeiro>): Promise<Financeiro> {
const financeiro = this.financeiroRepository.create({
    tipo: data.tipo,
    descricao: data.descricao,
    valor: data.valor,
    status: data.status,
    data_vencimento: data.data_vencimento,
    data_pagamento: data.data_pagamento
});

return await this.financeiroRepository.save(financeiro);
}

async findAll(): Promise<Financeiro[]> {
return await this.financeiroRepository.find();
}

async findById(id: number): Promise<Financeiro> {
const financeiro = await this.financeiroRepository.findOne({
    where: { id }
});

if (!financeiro) {
    throw new Error("Registro financeiro não encontrado.");
}

return financeiro;
}

async update(id: number, data: Partial<Financeiro>): Promise<Financeiro> {
const financeiro = await this.financeiroRepository.findOne({
    where: { id }
});

if (!financeiro) {
    throw new Error("Registro financeiro não encontrado.");
}

this.financeiroRepository.merge(financeiro, data);

return await this.financeiroRepository.save(financeiro);
}

async delete(id: number): Promise<void> {
const financeiro = await this.financeiroRepository.findOne({
    where: { id }
});

if (!financeiro) {
    throw new Error("Registro financeiro não encontrado.");
}

await this.financeiroRepository.remove(financeiro);
}
}