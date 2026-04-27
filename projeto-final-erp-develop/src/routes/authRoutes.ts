import { Router } from "express";
import { appDataSource } from "../database/appDataSource.js";
import { AuthController} from "../controllers/AuthController.js";
import { AuthService } from "../services/AuthService.js";
import { validateBody } from "../middlewares/validateBody.js";
import { loginSchema, refreshSchema, logoutSchema } from "../dtos/AuthDTO.js";

const router = Router();

const authService = new AuthService(appDataSource);
const authController = new AuthController(authService);

router.post("/login", validateBody(loginSchema), authController.login.bind(authController));
router.post("/refresh", validateBody(refreshSchema), authController.refresh.bind(authController));
router.post("/logout", validateBody(logoutSchema), authController.logout.bind(authController));

export default router;