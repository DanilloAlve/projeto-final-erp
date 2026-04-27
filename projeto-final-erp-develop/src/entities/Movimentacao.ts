import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from "typeorm";
import { Produto, Usuario } from "./core.entities.js";

export enum TipoMovimentacao {
  ENTRADA = "entrada",
  SAIDA = "saida",
}

export enum MotivoMovimentacao {
  VENDA = "venda",
  COMPRA = "compra",
  AJUSTE = "ajuste",
  DEVOLUCAO = "devolucao",
}

@Entity("movimentacao_estoque")
export class MovimentacaoEstoque {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Produto, { nullable: false })
  @JoinColumn({ name: "produto_id" })
  produto!: Produto;

  // Tipo da movimentação
  @Column({type: "enum", enum: TipoMovimentacao, nullable: false })
  tipo!: TipoMovimentacao;

  @Column({ type: "int" })
  quantidade!: number;

  @Column({ type: "enum", enum: MotivoMovimentacao, nullable: false })
  motivo!: MotivoMovimentacao; // motivo da movimentação

  // Usuário que registrou
  @ManyToOne(() => Usuario, { nullable: false })
  @JoinColumn({ name: "usuario_id" })
  usuario!: Usuario;

  // Observação (opcional)
  @Column({ type: "varchar", length: 255, nullable: true })
  observacao?: string;

  // Data de criação
  @CreateDateColumn()
  created_at!: Date;
}