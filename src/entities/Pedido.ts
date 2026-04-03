import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from "typeorm";
import { Cliente } from "./Cliente.js";
import { Usuario } from "./Usuario.js";
import { ItemPedido } from "./ItemPedido.js";

@Entity("pedido")
export class Pedido {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Cliente, (cliente) => cliente.pedidos)
  cliente!: Cliente;

  @ManyToOne(() => Usuario, (usuario) => usuario.pedidos)
  usuario!: Usuario;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  total!: number;

  @Column({ type: "varchar", nullable: false })
  status!: string; // aberto, pago, cancelado

  @OneToMany(() => ItemPedido, (item) => item.pedido, {
    cascade: true,
  })
  itens!: ItemPedido[];
}