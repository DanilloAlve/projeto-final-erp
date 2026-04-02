import { Router } from "express";
import { appDataSource } from "../database/appDataSource.js";
import { UsuarioService } from "../services/UsuarioService.js";
import UsuarioController from "../controllers/UsuarioController.js";

const router = Router();

const usuarioService = new UsuarioService(appDataSource);
const usuarioController = new UsuarioController(usuarioService);

router.get("/", (req, res) => usuarioController.findAllUser(req, res));
router.get("/:id", (req, res) => usuarioController.findUserById(req, res));
router.post("/", (req, res) => usuarioController.createUser(req, res));
router.put("/:id", (req, res) => usuarioController.updateUser(req, res));

export { router as usuarioRoutes };

