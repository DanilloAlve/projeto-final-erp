import "dotenv/config";
import { appDataSource } from "../database/appDataSource.js";
import { PedidoService } from "../services/PedidoService.js";

async function run(): Promise<void> {
  await appDataSource.initialize();

  try {
    const pedidoService = new PedidoService(appDataSource);
    await pedidoService.preencherCodigosPedidosExistentes();
    console.log("Seed finalizado: codigos de venda preenchidos para pedidos sem codigo.");
  } finally {
    if (appDataSource.isInitialized) {
      await appDataSource.destroy();
    }
  }
}

run().catch((error) => {
  console.error("Erro ao executar seed de codigos de venda:", error);
  process.exit(1);
});
