import "reflect-metadata";
import "dotenv/config";
import { randomUUID } from "node:crypto";
import { hash } from "bcryptjs";
import { appDataSource } from "../database/appDataSource.js";
import { Usuario } from "../entities/core.entities.js";
import { Perfil } from "../types/Perfil.js";

const DEFAULT_EMAIL = "admin@orbis.com";
const DEFAULT_NOME = "Administrador";
/** Senha inicial apenas para desenvolvimento; altere via ADMIN_SEED_PASSWORD no .env */
const DEFAULT_PASSWORD = "@O1234";

async function main() {
  console.log("[seed] Conectando ao banco...");
  await appDataSource.initialize();

  const email = process.env.ADMIN_SEED_EMAIL ?? DEFAULT_EMAIL;
  const repo = appDataSource.getRepository(Usuario);

  const existente = await repo.findOne({ where: { email } });
  if (existente) {
    console.log(`[seed] Usuário administrador já existe (${email}). Nada a fazer.`);
    await appDataSource.destroy();
    return;
  }

  const nome = process.env.ADMIN_SEED_NOME ?? DEFAULT_NOME;
  const senhaPlano = process.env.ADMIN_SEED_PASSWORD ?? DEFAULT_PASSWORD;
  const senhaHash = await hash(senhaPlano, 10);

  const admin = repo.create({
    id_user: randomUUID(),
    nome,
    email,
    senha: senhaHash,
    perfil: Perfil.ADMINISTRADOR_SISTEMA,
    ativo: true,
  });

  await repo.save(admin);
  console.log(`[seed] Administrador criado: ${email} (perfil ${Perfil.ADMINISTRADOR_SISTEMA}).`);
  await appDataSource.destroy();
}

main().catch((err) => {
  console.error("[seed] Falha:", err);
  process.exit(1);
});
