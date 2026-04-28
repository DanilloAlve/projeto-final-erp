import { Router } from "express";
import { ClienteController } from "../controllers/ClienteController.js";
import { ensureAuth } from "../middlewares/ensureAuth.js";

const clienteRoutes = Router();
const clienteController = new ClienteController();

clienteRoutes.post("/", ensureAuth, (req, res) => clienteController.create(req, res));
clienteRoutes.get("/", ensureAuth, (req, res) => clienteController.findAll(req, res));
clienteRoutes.get("/:id", ensureAuth, (req, res) => clienteController.findById(req, res));
clienteRoutes.put("/:id", ensureAuth, (req, res) => clienteController.update(req, res));
clienteRoutes.delete("/:id", ensureAuth, (req, res) => clienteController.delete(req, res));

export default clienteRoutes;