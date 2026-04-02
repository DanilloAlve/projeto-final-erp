import { Router } from "express";
import { appDataSource } from "../database/appDataSource.js";
import { CategoriaService } from "../services/CategoriaService.js";
import CategoriaController from "../controllers/CategoriaController.js";

const router = Router();

const categoriaService = new CategoriaService(appDataSource);
const categoriaController = new CategoriaController(categoriaService);

router.get("/", (req, res) => categoriaController.findAllCategoria(req, res));
router.get("/:id", (req, res) => categoriaController.findCategoriaById(req, res));
router.post("/", (req, res) => categoriaController.createCategoria(req, res));
router.put("/:id", (req, res) => categoriaController.updateCategoria(req, res));
router.delete("/:id", (req, res) => categoriaController.deleteCategoria(req, res));

export { router as categoriaRoutes };
