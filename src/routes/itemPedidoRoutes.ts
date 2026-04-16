import { Router } from "express";
import { appDataSource } from "../database/appDataSource.js";
import { ItemPedidoService } from "../services/ItemPedidoService.js";
import { ItemPedidoController } from "../controllers/ItemPedidoController.js";
import { ensureAuth } from "../middlewares/ensureAuth.js";
import { validateBody } from "../middlewares/validateBody.js";
import { createItemPedidoSchema, updateItemPedidoSchema } from "../dtos/ItemPedidoDTO.js";

const router = Router();

const service = new ItemPedidoService(appDataSource);
const controller = new ItemPedidoController(service);

router.get("/", ensureAuth, controller.findAll.bind(controller));
router.get("/:id", ensureAuth, controller.findById.bind(controller));
router.post("/", ensureAuth, validateBody(createItemPedidoSchema), controller.create.bind(controller));
router.put("/:id", ensureAuth, validateBody(updateItemPedidoSchema), controller.update.bind(controller));
router.delete("/:id", ensureAuth, controller.delete.bind(controller));

export default router;
