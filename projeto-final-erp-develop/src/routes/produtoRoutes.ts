import { Router } from "express";
import { appDataSource } from "../database/appDataSource.js";
import { ProdutoService } from "../services/ProdutoService.js";
import ProdutoController from "../controllers/ProdutoController.js";
import { ensureAuth } from "../middlewares/ensureAuth.js";
import { authorize } from "../middlewares/authorize.js";

const router = Router();

const produtoService = new ProdutoService(appDataSource);
const produtoController = new ProdutoController(produtoService);

router.get("/", ensureAuth, authorize("produto", "read"), (req, res) => produtoController.findAllProduto(req, res));
router.get("/:id", ensureAuth, authorize("produto", "read"), (req, res) => produtoController.findProdutoById(req, res));
router.post("/", ensureAuth, authorize("produto", "create"), (req, res) => produtoController.createProduto(req, res));
router.put("/:id", ensureAuth, authorize("produto", "update"), (req, res) => produtoController.updateProduto(req, res));
router.delete("/:id", ensureAuth, authorize("produto", "delete"), (req, res) => produtoController.deleteProduto(req, res));

export { router as produtoRoutes };

