import { Router } from "express";
import { ClienteController } from "../controllers/ClienteController.js";
import { ensureAuth } from "../middlewares/ensureAuth.js";
import { authorize } from "../middlewares/authorize.js";

const clienteRoutes = Router();
const clienteController = new ClienteController();

clienteRoutes.post("/", ensureAuth, authorize("cliente", "create"), (req, res) => clienteController.create(req, res));
clienteRoutes.get("/", ensureAuth, authorize("cliente", "read"), (req, res) => clienteController.findAll(req, res));
clienteRoutes.get("/:id", ensureAuth, authorize("cliente", "read"), (req, res) => clienteController.findById(req, res));
clienteRoutes.put("/:id", ensureAuth, authorize("cliente", "update"), (req, res) => clienteController.update(req, res));
clienteRoutes.delete("/:id", ensureAuth, authorize("cliente", "delete"), (req, res) => clienteController.delete(req, res));

export default clienteRoutes;