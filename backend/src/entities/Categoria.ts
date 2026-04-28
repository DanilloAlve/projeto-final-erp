import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { Produto } from "./Produto.js";

@Entity("categoria")
export class Categoria {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: "varchar", nullable: false, unique: true })
  nome!: string;

  @Column({ type: "varchar", nullable: true })
  descricao?: string;

  @Column({ type: "boolean", default: true })
  status!: boolean;

  @OneToMany(() => Produto, (produto) => produto.categoria)
  produtos!: Produto[];

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}