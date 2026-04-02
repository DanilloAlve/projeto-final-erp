import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Perfil } from '../types/Perfil.js';
import { Pedido } from "./Pedido.js";

@Entity('usuario')
export class Usuario {

  @PrimaryGeneratedColumn('uuid')
  id_user!: number;

  @Column({ type: 'varchar', nullable: false, unique: true })
  nome!: string;

  @Column({ type: 'varchar', nullable: false, unique: true })
  email!: string;

  @Column({ type: 'varchar', select:false, nullable: false })
  senha!: string;

  @Column({ type: 'enum', enum: Perfil, select:false, nullable: false })
  perfil!: Perfil;

  @Column({ default: true })
  ativo!: boolean;

  @OneToMany(() => Pedido, (pedido) => pedido.usuario)
  pedidos!: Pedido[];
}