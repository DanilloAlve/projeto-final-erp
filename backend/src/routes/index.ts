import { Router } from "express";
import clienteRoutes from "./clienteRoutes.js";
import financeiroRoutes from "./financeiroRoutes.js";

const routes = Router();

routes.use("/clientes", clienteRoutes);
routes.use("/financeiro", financeiroRoutes);

export default routes;