/**
 * Entidades reunidas aqui para evitar importação circular.
 * Quando precisar, importe por este arquivo.
 */
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Perfil } from "../types/Perfil.js";

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

@Entity("categoria")
export class Categoria {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", nullable: false, unique: true })
  nome!: string;

  @Column({ type: "varchar", nullable: true })
  descricao?: string;

  @OneToMany(() => Produto, (produto) => produto.categoria)
  produtos!: Produto[];

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}

@Entity("produto")
export class Produto {
  @PrimaryGeneratedColumn("uuid")
  id_prod!: string;

  @Column({ type: "varchar", nullable: false })
  nome!: string;

  @Column({ type: "varchar", nullable: true })
  descricao!: string | null;

  @Column({ type: "varchar", nullable: false, unique: true })
  codigo!: string;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  preco!: number;

  @Column({ type: "int", default: 0 })
  estoque_atual!: number;

  @Column({ type: "int", nullable: false })
  estoque_minimo!: number;

  @Column({ type: "int", nullable: true })
  estoque_maximo!: number | null;

  @ManyToOne(() => Categoria, (categoria) => categoria.produtos)
  categoria!: Categoria;

  @Column({ type: "boolean", default: true })
  ativo!: boolean;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}

@Entity("usuario")
export class Usuario {
  @PrimaryGeneratedColumn("uuid")
  id_user!: string;

  @Column({ type: "varchar", nullable: false, unique: true })
  nome!: string;

  @Column({ type: "varchar", nullable: false, unique: true })
  email!: string;

  @Column({ type: "varchar", select: false, nullable: false })
  senha!: string;

  @Column({ type: "enum", enum: Perfil, select: false, nullable: false })
  perfil!: Perfil;

  @Column({ type: "boolean", default: true })
  ativo!: boolean;

  @OneToMany(() => Pedido, (pedido) => pedido.usuario)
  pedidos!: Pedido[];

  @OneToMany(() => Sessao, (s) => s.usuario)
  sessoes!: Sessao[];

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  created_at!: Date;
}

@Entity("sessao")
export class Sessao {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Usuario, (usuario) => usuario.sessoes, { onDelete: "CASCADE" })
  usuario!: Usuario;

  @Column({ type: "text", nullable: false })
  refresh_token_hash!: string;

  @Column({ type: "timestamp", nullable: false })
  expires_at!: Date;

  @Column({ type: "timestamp", nullable: true })
  revoked_at?: Date | null;

  @Column({ type: "text", nullable: true })
  ip?: string | null;

  @Column({ type: "text", nullable: true })
  user_agent?: string | null;

  @CreateDateColumn({ type: "datetime" })
  created_at!: Date;
}

@Entity("pedido")
export class Pedido {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Cliente, (cliente) => cliente.pedidos)
  cliente!: Cliente;

  @ManyToOne(() => Usuario, (usuario) => usuario.pedidos)
  usuario!: Usuario;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  total!: number;

  @Column({ type: "enum", enum: ["aberto", "pago", "cancelado"], default: "aberto" })
  status!: string;

  @OneToMany(() => ItemPedido, (item) => item.pedido, {
    cascade: true,
  })
  itens!: ItemPedido[];

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  created_at!: Date;
}

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
