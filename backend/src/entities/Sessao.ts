import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Usuario } from "./Usuario.js";

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

    // datetime evita erros de DEFAULT em TIMESTAMP(6) em algumas versões/configurações do MySQL.
    // CreateDateColumn preenche o valor no INSERT; não dependemos de DEFAULT no servidor.
    @CreateDateColumn({ type: "datetime" })
    created_at!: Date;
}