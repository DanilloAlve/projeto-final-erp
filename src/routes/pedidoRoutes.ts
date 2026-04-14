import { Router } from "express";
import { PedidoController } from "../controllers/PedidoController.js";
import { PedidoService } from "../services/PedidoService.js";
import { appDataSource } from "../database/appDataSource.js";
import { ensureAuth } from "../middlewares/ensureAuth.js";

const router = Router();

const service = new PedidoService(appDataSource);
const controller = new PedidoController(service);

router.post("/", ensureAuth, controller.create.bind(controller));
router.get("/", ensureAuth, controller.findAll.bind(controller));
router.get("/:id", ensureAuth, controller.findById.bind(controller));
router.patch("/:id/status", ensureAuth, controller.updateStatus.bind(controller));
router.delete("/:id", ensureAuth, controller.delete.bind(controller));

export default router;