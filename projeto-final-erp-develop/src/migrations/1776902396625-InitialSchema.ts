import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1776902396625 implements MigrationInterface {
    name = 'InitialSchema1776902396625'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`cliente\` (\`id\` int NOT NULL AUTO_INCREMENT, \`nome\` varchar(255) NOT NULL, \`cpf_cnpj\` varchar(255) NOT NULL, \`email\` varchar(255) NULL, \`telefone\` varchar(255) NULL, UNIQUE INDEX \`IDX_df4e7a56a6b7b8b3d50ca1d69d\` (\`cpf_cnpj\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`categoria\` (\`id\` varchar(36) NOT NULL, \`nome\` varchar(255) NOT NULL, \`descricao\` varchar(255) NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_0a9942514087463668e9638bf9\` (\`nome\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`produto\` (\`id_prod\` varchar(36) NOT NULL, \`nome\` varchar(255) NOT NULL, \`descricao\` varchar(255) NULL, \`codigo\` varchar(255) NOT NULL, \`preco\` decimal(10,2) NOT NULL DEFAULT '0.00', \`estoque_atual\` int NOT NULL DEFAULT '0', \`estoque_minimo\` int NOT NULL, \`estoque_maximo\` int NULL, \`ativo\` tinyint NOT NULL DEFAULT 1, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`categoriaId\` varchar(36) NULL, UNIQUE INDEX \`IDX_25c3d3b4470aed83c75ea77895\` (\`codigo\`), PRIMARY KEY (\`id_prod\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`item_pedido\` (\`id\` int NOT NULL AUTO_INCREMENT, \`quantidade\` int NOT NULL, \`preco_unitario\` decimal(10,2) NOT NULL, \`pedidoId\` varchar(36) NULL, \`produtoIdProd\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`pedido\` (\`id\` varchar(36) NOT NULL, \`total\` decimal(10,2) NOT NULL, \`status\` enum ('aberto', 'pago', 'cancelado') NOT NULL DEFAULT 'aberto', \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, \`clienteId\` int NULL, \`usuarioIdUser\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`sessao\` (\`id\` varchar(36) NOT NULL, \`refresh_token_hash\` text NOT NULL, \`expires_at\` timestamp NOT NULL, \`revoked_at\` timestamp NULL, \`ip\` text NULL, \`user_agent\` text NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`usuarioIdUser\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`usuario\` (\`id_user\` varchar(36) NOT NULL, \`nome\` varchar(255) NOT NULL, \`email\` varchar(255) NOT NULL, \`senha\` varchar(255) NOT NULL, \`perfil\` enum ('ADMINISTRADOR_SISTEMA', 'GERENTE_SUPERVISOR', 'OPERADOR_ESTOQUE', 'FINANCEIRO_CONTADOR', 'APENAS_VISUALIZACAO') NOT NULL, \`ativo\` tinyint NOT NULL DEFAULT 1, \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE INDEX \`IDX_aa7d78895f0998f84649d3902c\` (\`nome\`), UNIQUE INDEX \`IDX_2863682842e688ca198eb25c12\` (\`email\`), PRIMARY KEY (\`id_user\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`financeiro\` (\`id\` varchar(36) NOT NULL, \`tipo\` enum ('receita', 'despesa') NOT NULL, \`descricao\` varchar(255) NOT NULL, \`valor\` decimal(10,2) NOT NULL, \`status\` enum ('pendente', 'pago', 'cancelado') NOT NULL DEFAULT 'pendente', \`data_vencimento\` date NOT NULL, \`data_pagamento\` timestamp NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`movimentacao_estoque\` (\`id\` varchar(36) NOT NULL, \`tipo\` enum ('entrada', 'saida') NOT NULL, \`quantidade\` int NOT NULL, \`motivo\` enum ('venda', 'compra', 'ajuste', 'devolucao') NOT NULL, \`observacao\` varchar(255) NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`produto_id\` varchar(36) NOT NULL, \`usuario_id\` varchar(36) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`produto\` ADD CONSTRAINT \`FK_8a1e81267ae184590ce1ee9a39b\` FOREIGN KEY (\`categoriaId\`) REFERENCES \`categoria\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`item_pedido\` ADD CONSTRAINT \`FK_dd1fc6faef3559845d57da2828e\` FOREIGN KEY (\`pedidoId\`) REFERENCES \`pedido\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`item_pedido\` ADD CONSTRAINT \`FK_6176dcd32e478d43f45ac6b3ad4\` FOREIGN KEY (\`produtoIdProd\`) REFERENCES \`produto\`(\`id_prod\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`pedido\` ADD CONSTRAINT \`FK_2730a0c3947641edf256551f10c\` FOREIGN KEY (\`clienteId\`) REFERENCES \`cliente\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`pedido\` ADD CONSTRAINT \`FK_687cca2a13b1234f67ba4e6bef6\` FOREIGN KEY (\`usuarioIdUser\`) REFERENCES \`usuario\`(\`id_user\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`sessao\` ADD CONSTRAINT \`FK_77ec00d66fb7921b9841b13454c\` FOREIGN KEY (\`usuarioIdUser\`) REFERENCES \`usuario\`(\`id_user\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`movimentacao_estoque\` ADD CONSTRAINT \`FK_1bd35f74e7d57915a0bac3488c7\` FOREIGN KEY (\`produto_id\`) REFERENCES \`produto\`(\`id_prod\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`movimentacao_estoque\` ADD CONSTRAINT \`FK_8b4b3bd274232de1537e34a1b4e\` FOREIGN KEY (\`usuario_id\`) REFERENCES \`usuario\`(\`id_user\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`movimentacao_estoque\` DROP FOREIGN KEY \`FK_8b4b3bd274232de1537e34a1b4e\``);
        await queryRunner.query(`ALTER TABLE \`movimentacao_estoque\` DROP FOREIGN KEY \`FK_1bd35f74e7d57915a0bac3488c7\``);
        await queryRunner.query(`ALTER TABLE \`sessao\` DROP FOREIGN KEY \`FK_77ec00d66fb7921b9841b13454c\``);
        await queryRunner.query(`ALTER TABLE \`pedido\` DROP FOREIGN KEY \`FK_687cca2a13b1234f67ba4e6bef6\``);
        await queryRunner.query(`ALTER TABLE \`pedido\` DROP FOREIGN KEY \`FK_2730a0c3947641edf256551f10c\``);
        await queryRunner.query(`ALTER TABLE \`item_pedido\` DROP FOREIGN KEY \`FK_6176dcd32e478d43f45ac6b3ad4\``);
        await queryRunner.query(`ALTER TABLE \`item_pedido\` DROP FOREIGN KEY \`FK_dd1fc6faef3559845d57da2828e\``);
        await queryRunner.query(`ALTER TABLE \`produto\` DROP FOREIGN KEY \`FK_8a1e81267ae184590ce1ee9a39b\``);
        await queryRunner.query(`DROP TABLE \`movimentacao_estoque\``);
        await queryRunner.query(`DROP TABLE \`financeiro\``);
        await queryRunner.query(`DROP INDEX \`IDX_2863682842e688ca198eb25c12\` ON \`usuario\``);
        await queryRunner.query(`DROP INDEX \`IDX_aa7d78895f0998f84649d3902c\` ON \`usuario\``);
        await queryRunner.query(`DROP TABLE \`usuario\``);
        await queryRunner.query(`DROP TABLE \`sessao\``);
        await queryRunner.query(`DROP TABLE \`pedido\``);
        await queryRunner.query(`DROP TABLE \`item_pedido\``);
        await queryRunner.query(`DROP INDEX \`IDX_25c3d3b4470aed83c75ea77895\` ON \`produto\``);
        await queryRunner.query(`DROP TABLE \`produto\``);
        await queryRunner.query(`DROP INDEX \`IDX_0a9942514087463668e9638bf9\` ON \`categoria\``);
        await queryRunner.query(`DROP TABLE \`categoria\``);
        await queryRunner.query(`DROP INDEX \`IDX_df4e7a56a6b7b8b3d50ca1d69d\` ON \`cliente\``);
        await queryRunner.query(`DROP TABLE \`cliente\``);
    }

}
