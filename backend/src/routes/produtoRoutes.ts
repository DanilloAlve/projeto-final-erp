import { Router } from "express";
import { appDataSource } from "../database/appDataSource.js";
import { ProdutoService } from "../services/ProdutoService.js";
import ProdutoController from "../controllers/ProdutoController.js";
import { ensureAuth } from "../middlewares/ensureAuth.js";

const router = Router();

const produtoService = new ProdutoService(appDataSource);
const produtoController = new ProdutoController(produtoService);

router.get("/", ensureAuth, (req, res) => produtoController.findAllProduto(req, res));
router.get("/:id", ensureAuth, (req, res) => produtoController.findProdutoById(req, res));
router.post("/", ensureAuth, (req, res) => produtoController.createProduto(req, res));
router.put("/:id", ensureAuth, (req, res) => produtoController.updateProduto(req, res));
router.delete("/:id", ensureAuth, (req, res) => produtoController.deleteProduto(req, res));

export { router as produtoRoutes };

