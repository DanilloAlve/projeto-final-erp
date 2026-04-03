import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Pedido } from "./Pedido.js";

@Entity("cliente")
export class Cliente {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", nullable: false })
  nome!: string;

  @Column({ type: "varchar", nullable: false, unique: true })
  cpf_cnpj!: string;

  @Column({ type: "varchar", nullable: true })
  email?: string;

  @Column({ type: "varchar", nullable: true })
  telefone?: string;

  @OneToMany(() => Pedido, (pedido) => pedido.cliente)
  pedidos!: Pedido[];
}