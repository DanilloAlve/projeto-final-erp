import "reflect-metadata";
import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
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

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Config do TypeORM usada só para rodar migrations pela CLI. */
export default new DataSource({
  type: "mysql",
  host: process.env.DB_HOST as string,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER as string,
  password: process.env.DB_PASS as string,
  database: process.env.DB_NAME as string,

  synchronize: false,
  logging: false,

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
  migrations: [path.join(__dirname, "..", "migrations", "*.js")],
});
