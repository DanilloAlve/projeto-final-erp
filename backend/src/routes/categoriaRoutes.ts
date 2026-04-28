import { Router } from "express";
import { appDataSource } from "../database/appDataSource.js";
import { CategoriaService } from "../services/CategoriaService.js";
import CategoriaController from "../controllers/CategoriaController.js";
import { ensureAuth } from "../middlewares/ensureAuth.js";

const router = Router();

const categoriaService = new CategoriaService(appDataSource);
const categoriaController = new CategoriaController(categoriaService);

router.get("/", ensureAuth, (req, res) => categoriaController.findAllCategoria(req, res));
router.get("/:id", ensureAuth, (req, res) => categoriaController.findCategoriaById(req, res));
router.post("/", ensureAuth, (req, res) => categoriaController.createCategoria(req, res));
router.put("/:id", ensureAuth, (req, res) => categoriaController.updateCategoria(req, res));
router.delete("/:id", ensureAuth, (req, res) => categoriaController.deleteCategoria(req, res));

export { router as categoriaRoutes };
