import { Router } from "express";
import { MovimentacaoEstoqueService } from "../services/MovimentacaoService.js";
import { MovimentacaoEstoqueController } from "../controllers/MovimentacaoController.js";
import { ensureAuth } from "../middlewares/ensureAuth.js";
import { authorize } from "../middlewares/authorize.js";
import { validateBody } from "../middlewares/validateBody.js";
import { createMovimentacaoSchema } from "../dtos/MovimentacaoDTO.js";

const router = Router();

const service = new MovimentacaoEstoqueService();
const controller = new MovimentacaoEstoqueController(service);

router.post(
  "/",
  ensureAuth,
  authorize("movimentacao", "create"),
  validateBody(createMovimentacaoSchema),
  controller.create.bind(controller)
);

router.get(
  "/",
  ensureAuth,
  authorize("movimentacao", "read"),
  controller.findAll.bind(controller)
);

router.get(
  "/:id",
  ensureAuth,
  authorize("movimentacao", "read"),
  controller.findById.bind(controller)
);

router.delete(
  "/:id",
  ensureAuth,
  authorize("movimentacao", "delete"),
  controller.delete.bind(controller)
);

export default router;