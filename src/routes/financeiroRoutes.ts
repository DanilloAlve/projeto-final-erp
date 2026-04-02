import { Router } from "express";
import { FinanceiroController } from "../controllers/FinanceiroController.js";

const financeiroRoutes = Router();
const financeiroController = new FinanceiroController();

financeiroRoutes.post("/", (req, res) => financeiroController.create(req, res));
financeiroRoutes.get("/", (req, res) => financeiroController.findAll(req, res));
financeiroRoutes.get("/:id", (req, res) => financeiroController.findById(req, res));
financeiroRoutes.put("/:id", (req, res) => financeiroController.update(req, res));
financeiroRoutes.delete("/:id", (req, res) => financeiroController.delete(req, res));

export default financeiroRoutes;