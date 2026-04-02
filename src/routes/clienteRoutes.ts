import { Router } from "express";
import { ClienteController } from "../controllers/ClienteController.js";

const clienteRoutes = Router();
const clienteController = new ClienteController();

clienteRoutes.post("/", (req, res) => clienteController.create(req, res));
clienteRoutes.get("/", (req, res) => clienteController.findAll(req, res));
clienteRoutes.get("/:id", (req, res) => clienteController.findById(req, res));
clienteRoutes.put("/:id", (req, res) => clienteController.update(req, res));
clienteRoutes.delete("/:id", (req, res) => clienteController.delete(req, res));

export default clienteRoutes;