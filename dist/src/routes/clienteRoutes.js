import { Router } from "express";
import { appDataSource } from "../database/appDataSource.js";
import ClienteController from "../controllers/ClienteController.js";
import { ClienteService } from "../services/ClienteService.js";
import { ensureAuth } from "../middlewares/ensureAuth.js";
import { authorize } from "../middlewares/authorize.js";
import { validateBody } from "../middlewares/validateBody.js";
import { validateParams } from "../middlewares/validateParams.js";
import { clienteIdParamsSchema, createClienteSchema, updateClienteSchema, } from "../dtos/ClienteDTO.js";
const clienteRoutes = Router();
const clienteService = new ClienteService(appDataSource);
const clienteController = new ClienteController(clienteService);
clienteRoutes.get("/", ensureAuth, authorize("cliente", "read"), clienteController.findAllCliente.bind(clienteController));
clienteRoutes.get("/:id", ensureAuth, authorize("cliente", "read"), validateParams(clienteIdParamsSchema, { statusCode: 422 }), clienteController.findClienteById.bind(clienteController));
clienteRoutes.post("/", ensureAuth, authorize("cliente", "create"), validateBody(createClienteSchema, { statusCode: 422 }), clienteController.createCliente.bind(clienteController));
clienteRoutes.put("/:id", ensureAuth, authorize("cliente", "update"), validateParams(clienteIdParamsSchema, { statusCode: 422 }), validateBody(updateClienteSchema, { statusCode: 422 }), clienteController.updateCliente.bind(clienteController));
clienteRoutes.delete("/:id", ensureAuth, authorize("cliente", "delete"), validateParams(clienteIdParamsSchema, { statusCode: 422 }), clienteController.deleteCliente.bind(clienteController));
export default clienteRoutes;
//# sourceMappingURL=clienteRoutes.js.map