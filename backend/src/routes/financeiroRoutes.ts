import { Router } from "express";
import { FinanceiroController } from "../controllers/FinanceiroController.js";
import { FinanceiroService } from "../services/FinanceiroService.js";
import { validateBody } from "../middlewares/validateBody.js";
import { ensureAuth } from "../middlewares/ensureAuth.js";
import { authorize } from "../middlewares/authorize.js";
import {
  createFinanceiroSchema,
  updateFinanceiroSchema,
  pagarFinanceiroSchema,
} from "../dtos/FinanceiroDTO.js";

const router = Router();

const service = new FinanceiroService();
const controller = new FinanceiroController(service);

router.post(
  "/",
  ensureAuth,
  authorize("financeiro", "create"),
  validateBody(createFinanceiroSchema),
  controller.create.bind(controller)
);

router.get(
  "/",
  ensureAuth,
  authorize("financeiro", "read"),
  controller.findAll.bind(controller)
);

router.get(
  "/:id",
  ensureAuth,
  authorize("financeiro", "read"),
  controller.findById.bind(controller)
);

router.put(
  "/:id",
  ensureAuth,
  authorize("financeiro", "update"),
  validateBody(updateFinanceiroSchema),
  controller.update.bind(controller)
);

router.patch(
  "/:id/pagar",
  ensureAuth,
  authorize("financeiro", "update"),
  validateBody(pagarFinanceiroSchema),
  controller.pagar.bind(controller)
);

router.delete(
  "/:id",
  ensureAuth,
  authorize("financeiro", "delete"),
  controller.delete.bind(controller)
);

export default router;