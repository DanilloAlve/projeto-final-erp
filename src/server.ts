import "reflect-metadata";
import express from "express";
import "dotenv/config";
import { appDataSource } from "./database/appDataSource.js";
import { produtoRoutes } from "./routes/produtoRoutes.js";
import { categoriaRoutes } from "./routes/categoriaRoutes.js";
import { usuarioRoutes } from "./routes/usuarioRoutes.js";
import financeiroRoutes from "./routes/financeiroRoutes.js";
import clienteRoutes from "./routes/clienteRoutes.js";
import pedidoRoutes from "./routes/pedidoRoutes.js";
import itemPedidoRoutes from "./routes/itemPedidoRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import movimentacaoRoutes from "./routes/movimentacaoRoutes.js";



const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(express.json());

// Rota de teste para confirmar que o servidor está funcionando
app.get("/health", (_req, res) => {
    res.json({ status: "ok", mensagem: "Servidor funcionando!" });
});

app.use(authRoutes);

app.use("/auth", authRoutes);
app.use("/produtos", produtoRoutes);
app.use("/categorias", categoriaRoutes);
app.use("/usuarios", usuarioRoutes);
app.use("/financeiro", financeiroRoutes);
app.use("/pedidos", pedidoRoutes);
app.use("/itens-pedido", itemPedidoRoutes);
app.use("/clientes", clienteRoutes);
app.use("/movimentacoes", movimentacaoRoutes);

appDataSource
    .initialize()
    .then(() => {
        console.log("Banco de dados conectado!");
        app.listen(PORT, () => {
            console.log(`Servidor rodando na porta ${PORT}`);
        });
    })
    .catch((error: Error) => {
        console.error("Erro ao conectar o banco:", error);
    });