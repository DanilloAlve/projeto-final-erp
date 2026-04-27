import { Router } from "express";
import { appDataSource } from "../database/appDataSource.js";
import { CategoriaService } from "../services/CategoriaService.js";
import CategoriaController from "../controllers/CategoriaController.js";
import { ensureAuth } from "../middlewares/ensureAuth.js";
import { authorize } from "../middlewares/authorize.js";

const router = Router();

const categoriaService = new CategoriaService(appDataSource);
const categoriaController = new CategoriaController(categoriaService);

router.get("/", ensureAuth, authorize("categoria", "read"), (req, res) => categoriaController.findAllCategoria(req, res));
router.get("/:id", ensureAuth, authorize("categoria", "read"), (req, res) => categoriaController.findCategoriaById(req, res));
router.post("/", ensureAuth, authorize("categoria", "create"), (req, res) => categoriaController.createCategoria(req, res));
router.put("/:id", ensureAuth, authorize("categoria", "update"), (req, res) => categoriaController.updateCategoria(req, res));
router.delete("/:id", ensureAuth, authorize("categoria", "delete"), (req, res) => categoriaController.deleteCategoria(req, res));

export { router as categoriaRoutes };
