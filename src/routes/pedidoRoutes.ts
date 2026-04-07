import { Router } from "express";
import { PedidoController } from "../controllers/PedidoController.js";
import { PedidoService } from "../services/PedidoService.js";
import { appDataSource } from "../database/appDataSource.js";

const router = Router();

const service = new PedidoService(appDataSource);
const controller = new PedidoController(service);

router.post("/", controller.create.bind(controller));
router.get("/", controller.findAll.bind(controller));
router.get("/:id", controller.findById.bind(controller));
router.patch("/:id/status", controller.updateStatus.bind(controller));
router.delete("/:id", controller.delete.bind(controller));

export default router;