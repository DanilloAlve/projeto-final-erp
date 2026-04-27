import { Router } from "express";
import { appDataSource } from "../database/appDataSource.js";
import { DashboardService } from "../services/DashboardService.js";
import { DashboardController } from "../controllers/DashboardController.js";
import { ensureAuth } from "../middlewares/ensureAuth.js";

const router = Router();

const service = new DashboardService(appDataSource);
const controller = new DashboardController(service);

router.get("/resumo", ensureAuth, controller.getResumo.bind(controller));
router.get("/graficos", ensureAuth, controller.getGraficos.bind(controller));

export { router as dashboardRoutes };
