import { Request, Response } from "express";
import { DashboardService } from "../services/DashboardService.js";

export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  async getResumo(_req: Request, res: Response) {
    try {
      const resumo = await this.dashboardService.getResumo();
      return res.json(resumo);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Erro ao carregar resumo do dashboard" });
    }
  }

  async getGraficos(_req: Request, res: Response) {
    try {
      const graficos = await this.dashboardService.getGraficos();
      return res.json(graficos);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Erro ao carregar gráficos do dashboard" });
    }
  }

  async getHistoricosRecentes(_req: Request, res: Response) {
    try {
      const historicos = await this.dashboardService.getHistoricosRecentes(5);
      return res.json(historicos);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Erro ao carregar historicos recentes do dashboard" });
    }
  }
}
