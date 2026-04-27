import { Router } from "express";
import { PedidoController } from "../controllers/PedidoController.js";
import { PedidoService } from "../services/PedidoService.js";
import { appDataSource } from "../database/appDataSource.js";
import { ensureAuth } from "../middlewares/ensureAuth.js";
import { authorize } from "../middlewares/authorize.js";

const router = Router();

const service = new PedidoService(appDataSource);
const controller = new PedidoController(service);

router.post("/", ensureAuth, authorize("pedido", "create"), controller.create.bind(controller));
router.get("/", ensureAuth, authorize("pedido", "read"), controller.findAll.bind(controller));
router.get("/:id", ensureAuth, authorize("pedido", "read"), controller.findById.bind(controller));
router.patch("/:id/status", ensureAuth, authorize("pedido", "update"), controller.updateStatus.bind(controller));
router.delete("/:id", ensureAuth, authorize("pedido", "delete"), controller.delete.bind(controller));

export default router;