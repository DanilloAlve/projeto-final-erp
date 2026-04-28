import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";

type DashboardResumo = {
  vendasMesAtual: number;
  produtosAtivos: number;
  totalClientes: number;
  crescimentoPercentual: number;
};

@Component({
  selector: "app-summary-cards",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./summary-cards.html",
  styleUrl: "./summary-cards.css",
})
export class SummaryCardsComponent {
  @Input({ required: true }) loading = true;
  @Input() resumo: DashboardResumo | null = null;

  formatCrescimento(valor: number | undefined): string {
    const v = valor ?? 0;
    const formatted = new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(v);
    const prefix = v > 0 ? "+" : "";
    return `${prefix}${formatted}%`;
  }
}
