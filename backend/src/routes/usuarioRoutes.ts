import { Router } from "express";
import { appDataSource } from "../database/appDataSource.js";
import { UsuarioService } from "../services/UsuarioService.js";
import UsuarioController from "../controllers/UsuarioController.js";
import { validateBody } from "../middlewares/validateBody.js";
import { validateParams } from "../middlewares/validateParams.js";
import {  createUsuarioSchema,  updateUsuarioSchema, usuarioIdParamsSchema, } from "../dtos/UsuarioDTO.js";
import { ensureAuth } from "../middlewares/ensureAuth.js";
import { ensureRole } from "../middlewares/ensureRole.js";
import { Perfil } from "../types/Perfil.js";

const router = Router();

const usuarioService = new UsuarioService(appDataSource);
const usuarioController = new UsuarioController(usuarioService);

router.get(
  "/",
  ensureAuth,
  ensureRole(Perfil.ADMINISTRADOR_SISTEMA, Perfil.GERENTE_SUPERVISOR),
  usuarioController.findAllUser.bind(usuarioController)
);

/** Mesmos handlers de `/:id`, para clientes que usam `/usuarios/id/<uuid>`. */
const findUserByIdStack = [
  ensureAuth,
  ensureRole(Perfil.ADMINISTRADOR_SISTEMA, Perfil.GERENTE_SUPERVISOR, Perfil.APENAS_VISUALIZACAO),
  validateParams(usuarioIdParamsSchema),
  usuarioController.findUserById.bind(usuarioController),
] as const;

router.get("/id/:id", ...findUserByIdStack);
router.get("/:id", ...findUserByIdStack);
router.post("/", validateBody(createUsuarioSchema), usuarioController.createUser.bind(usuarioController));

const updateUserStack = [
  ensureAuth,
  validateParams(usuarioIdParamsSchema),
  validateBody(updateUsuarioSchema),
  usuarioController.updateUser.bind(usuarioController),
] as const;

router.put("/id/:id", ...updateUserStack);
router.put("/:id", ...updateUserStack);

const deleteUserStack = [
  ensureAuth,
  ensureRole(Perfil.ADMINISTRADOR_SISTEMA, Perfil.GERENTE_SUPERVISOR),
  validateParams(usuarioIdParamsSchema),
  usuarioController.deleteUser.bind(usuarioController),
] as const;

router.delete("/id/:id", ...deleteUserStack);
router.delete("/:id", ...deleteUserStack);

export { router as usuarioRoutes };

