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
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Cliente, (cliente) => cliente.pedidos)
  cliente!: Cliente;

  @ManyToOne(() => Usuario, (usuario) => usuario.pedidos)
  usuario!: Usuario;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  total!: number;

  @Column({type: "enum", enum: ["aberto", "pago", "cancelado"], default: "aberto" })
    status!: string;

  @OneToMany(() => ItemPedido, (item) => item.pedido, {
    cascade: true,
  })
  itens!: ItemPedido[];

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    created_at!: Date;
}