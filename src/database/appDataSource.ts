import "reflect-metadata";
import "dotenv/config";
import { DataSource } from "typeorm";

import { Usuario } from "../entities/Usuario.js";
import { Produto } from "../entities/Produto.js";
import { Categoria } from "../entities/Categoria.js";
import { Pedido } from "../entities/Pedido.js";
import { ItemPedido } from "../entities/ItemPedido.js";
import { Cliente } from "../entities/Cliente.js";
import { Sessao } from "../entities/Sessao.js";
import { Financeiro } from "../entities/Financeiro.js";
import { MovimentacaoEstoque } from "../entities/Movimentacao.js";

export const appDataSource = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST as string,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER as string,
  password: process.env.DB_PASS as string,
  database: process.env.DB_NAME as string,

  synchronize: true,
  logging: true,

  entities: [Usuario, Sessao, Produto, Categoria, Pedido, ItemPedido, Cliente, Financeiro, MovimentacaoEstoque],
});