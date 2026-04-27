import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

export enum TipoFinanceiro {
  RECEITA = "receita",
  DESPESA = "despesa",
}

export enum StatusFinanceiro {
  PENDENTE = "pendente",
  PAGO = "pago",
  CANCELADO = "cancelado",
}

@Entity("financeiro")
export class Financeiro {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({type: "enum", enum: TipoFinanceiro,})
  tipo!: TipoFinanceiro;

  @Column({ type: "varchar", length: 255 })
  descricao!: string;

  @Column("decimal", { precision: 10, scale: 2 })
  valor!: number;

  @Column({
    type: "enum",
    enum: StatusFinanceiro,
    default: StatusFinanceiro.PENDENTE,
  })
  status!: StatusFinanceiro;

  @Column({ type: "date" })
  data_vencimento!: Date;

  @Column({ type: "timestamp", nullable: true })
  data_pagamento?: Date;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}