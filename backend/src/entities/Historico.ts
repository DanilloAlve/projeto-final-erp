import { CreateDateColumn, Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("historico")
export class Historico {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 100 })
  tabela!: string;

  @Column({ type: "varchar", length: 255 })
  acao!: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  registro_id!: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  referencia!: string | null;

  @CreateDateColumn({
    name: "data_modificacao",
    type: "timestamp",
    precision: 6,
    default: () => "CURRENT_TIMESTAMP(6)",
  })
  data_modificacao!: Date;
}
