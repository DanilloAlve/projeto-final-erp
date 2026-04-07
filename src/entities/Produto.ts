import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

import { Categoria } from "./Categoria.js";

@Entity('produto')
export class Produto {
  @PrimaryGeneratedColumn('uuid')
  id_prod!: string;

  @Column({ type: 'varchar', nullable: false })
  nome!: string;

  @Column({ type: 'varchar', nullable: true })
  descricao!: string | null;

  @Column({ type: 'varchar', nullable: false, unique: true })
  codigo!: string;

  // Em TypeORM, `decimal` pode vir como string em runtime dependendo da configuração;
  // aqui deixamos como number para facilitar uso no código.
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  preco!: number;

  @Column({ type: 'int', default: 0 })
  estoque_atual!: number;

  @Column({ type: 'int', nullable: false })
  estoque_minimo!: number;

  @Column({ type: 'int', nullable: true })
  estoque_maximo!: number | null;

  @ManyToOne(() => Categoria, (categoria) => categoria.produtos)
  categoria!: Categoria;

  @Column({ type: 'boolean', default: true })
  ativo!: boolean;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}