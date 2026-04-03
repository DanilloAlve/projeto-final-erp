import { Column, Entity, CreateDateColumn, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Perfil } from '../types/Perfil.js';
import { Pedido } from './Pedido.js';
import { Sessao } from "./Sessao.js";

@Entity('usuario')
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  id_user!: string;

  @Column({ type: 'varchar', nullable: false, unique: true })
  nome!: string;

  @Column({ type: 'varchar', nullable: false, unique: true })
  email!: string;

  @Column({ type: 'varchar', select: false, nullable: false })
  senha!: string;

  @Column({ type: 'enum', enum: Perfil, select: false, nullable: false })
  perfil!: Perfil;

  @Column({ type: 'boolean', default: true })
  ativo!: boolean;

  @OneToMany(() => Pedido, (pedido) => pedido.usuario)
  pedidos!: Pedido[];

  @OneToMany(() => Sessao, (s) => s.usuario)
  sessoes!: Sessao[]

  @Column({ type: "timestamp", default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date
}