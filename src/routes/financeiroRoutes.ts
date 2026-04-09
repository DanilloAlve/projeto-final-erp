import { Router } from "express";
import { FinanceiroController } from "../controllers/FinanceiroController.js";
import { FinanceiroService } from "../services/FinanceiroService.js";
import { validateBody } from "../middlewares/validateBody.js";
import {
  createFinanceiroSchema,
  updateFinanceiroSchema,
  pagarFinanceiroSchema,
} from "../dtos/FinanceiroDTO.js";

const router = Router();

const service = new FinanceiroService();
const controller = new FinanceiroController(service);

router.post("/", validateBody(createFinanceiroSchema), controller.create.bind(controller));

router.get("/", controller.findAll.bind(controller));
router.get("/:id", controller.findById.bind(controller));

router.put("/:id", validateBody(updateFinanceiroSchema), controller.update.bind(controller));

router.patch("/:id/pagar", validateBody(pagarFinanceiroSchema), controller.pagar.bind(controller));

router.delete("/:id", controller.delete.bind(controller));

export default router;