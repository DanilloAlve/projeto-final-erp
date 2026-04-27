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
import { dashboardRoutes } from "./routes/dashboardRoutes.js";
import { errorHandler } from "./middlewares/errorHandler.js";



const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(express.json());

app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Vary", "Origin");
    }
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization"
    );
    res.setHeader("Access-Control-Allow-Credentials", "true");

    if (req.method === "OPTIONS") {
        return res.sendStatus(204);
    }
    next();
});

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
app.use("/dashboard", dashboardRoutes);
app.use(errorHandler);

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