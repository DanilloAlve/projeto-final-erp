import "reflect-metadata";
import "dotenv/config";
import { DataSource } from "typeorm";

import {
  Cliente,
  Categoria,
  Produto,
  Usuario,
  Sessao,
  Pedido,
  ItemPedido,
} from "../entities/core.entities.js";
import { Financeiro } from "../entities/Financeiro.js";
import { MovimentacaoEstoque } from "../entities/Movimentacao.js";

export const appDataSource = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST as string,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER as string,
  password: process.env.DB_PASS as string,
  database: process.env.DB_NAME as string,

  /** As tabelas são criadas pelas migrations (setup/reset). */
  synchronize: false,
  logging: true,

  entities: [
    Cliente,
    Categoria,
    Produto,
    Usuario,
    Sessao,
    Pedido,
    ItemPedido,
    Financeiro,
    MovimentacaoEstoque,
  ],
});
