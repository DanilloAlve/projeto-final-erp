import { Router } from "express";
import { appDataSource } from "../database/appDataSource.js";
import { ProdutoService } from "../services/ProdutoService.js";
import ProdutoController from "../controllers/ProdutoController.js";

const router = Router();

const produtoService = new ProdutoService(appDataSource);
const produtoController = new ProdutoController(produtoService);

router.get("/", (req, res) => produtoController.findAllProduto(req, res));
router.get("/:id", (req, res) => produtoController.findProdutoById(req, res));
router.post("/", (req, res) => produtoController.createProduto(req, res));
router.put("/:id", (req, res) => produtoController.updateProduto(req, res));
router.delete("/:id", (req, res) => produtoController.deleteProduto(req, res));

export { router as produtoRoutes };

