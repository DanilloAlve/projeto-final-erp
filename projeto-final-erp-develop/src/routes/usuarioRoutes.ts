import { Router } from "express";
import { appDataSource } from "../database/appDataSource.js";
import { UsuarioService } from "../services/UsuarioService.js";
import UsuarioController from "../controllers/UsuarioController.js";
import { validateBody } from "../middlewares/validateBody.js";
import { validateParams } from "../middlewares/validateParams.js";
import {  createUsuarioSchema,  updateUsuarioSchema, usuarioIdParamsSchema, } from "../dtos/UsuarioDTO.js";
import { ensureAuth } from "../middlewares/ensureAuth.js";
import { authorize } from "../middlewares/authorize.js";

const router = Router();

const usuarioService = new UsuarioService(appDataSource);
const usuarioController = new UsuarioController(usuarioService);

router.get("/", ensureAuth, authorize("usuario", "read"), usuarioController.findAllUser.bind(usuarioController));

/** Atalhos para buscar usuário por id (suporta `/usuarios/:id` e `/usuarios/id/:id`). */
const findUserByIdStack = [
  ensureAuth,
  authorize("usuario", "read"),
  validateParams(usuarioIdParamsSchema),
  usuarioController.findUserById.bind(usuarioController),
] as const;

router.get("/id/:id", ...findUserByIdStack);
router.get("/:id", ...findUserByIdStack);
router.post(
  "/",
  ensureAuth,
  authorize("usuario", "create"),
  validateBody(createUsuarioSchema),
  usuarioController.createUser.bind(usuarioController)
);

const updateUserStack = [
  ensureAuth,
  authorize("usuario", "update"),
  validateParams(usuarioIdParamsSchema),
  validateBody(updateUsuarioSchema),
  usuarioController.updateUser.bind(usuarioController),
] as const;

router.put("/id/:id", ...updateUserStack);
router.put("/:id", ...updateUserStack);

const deleteUserStack = [
  ensureAuth,
  authorize("usuario", "delete"),
  validateParams(usuarioIdParamsSchema),
  usuarioController.deleteUser.bind(usuarioController),
] as const;

router.delete("/id/:id", ...deleteUserStack);
router.delete("/:id", ...deleteUserStack);

export { router as usuarioRoutes };

