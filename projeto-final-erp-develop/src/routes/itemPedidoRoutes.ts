import { Router } from "express";
import { appDataSource } from "../database/appDataSource.js";
import { ItemPedidoService } from "../services/ItemPedidoService.js";
import { ItemPedidoController } from "../controllers/ItemPedidoController.js";
import { ensureAuth } from "../middlewares/ensureAuth.js";
import { authorize } from "../middlewares/authorize.js";
import { validateBody } from "../middlewares/validateBody.js";
import { createItemPedidoSchema, updateItemPedidoSchema } from "../dtos/ItemPedidoDTO.js";

const router = Router();

const service = new ItemPedidoService(appDataSource);
const controller = new ItemPedidoController(service);

router.get("/", ensureAuth, authorize("pedido", "read"), controller.findAll.bind(controller));
router.get("/:id", ensureAuth, authorize("pedido", "read"), controller.findById.bind(controller));
router.post("/", ensureAuth, authorize("pedido", "create"), validateBody(createItemPedidoSchema), controller.create.bind(controller));
router.put("/:id", ensureAuth, authorize("pedido", "update"), validateBody(updateItemPedidoSchema), controller.update.bind(controller));
router.delete("/:id", ensureAuth, authorize("pedido", "delete"), controller.delete.bind(controller));

export default router;
