import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
} from "typeorm";
import { Pedido } from "./Pedido.js";
import { Produto } from "./Produto.js";

@Entity("item_pedido")
export class ItemPedido {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Pedido, (pedido) => pedido.itens)
  pedido!: Pedido;

  @ManyToOne(() => Produto)
  produto!: Produto;

  @Column({ type: "int", nullable: false })
  quantidade!: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  preco_unitario!: number;
}