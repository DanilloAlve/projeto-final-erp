import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";
import { RouterLink } from "@angular/router";

type StatusEstoqueNivel = "critico" | "atencao" | "estavel";

type LinhaStatusEstoque = {
  id: string;
  nome: string;
  skuLabel: string;
  codigo: string;
  categoriaNome: string;
  estoqueAtual: number;
  barraPct: number;
  status: StatusEstoqueNivel;
  iconTintIndex: number;
};

@Component({
  selector: "app-stock-status",
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: "./stock-status.html",
  styleUrl: "./stock-status.css",
})
export class StockStatusComponent {
  @Input({ required: true }) loading = true;
  @Input() linhasStatusEstoque: LinhaStatusEstoque[] = [];
  @Input() packageIconSrc = "/assets/menu/package.png";

  barraCorClass(status: StatusEstoqueNivel): string {
    switch (status) {
      case "critico":
        return "estoque-bar__fill--critico";
      case "atencao":
        return "estoque-bar__fill--atencao";
      default:
        return "estoque-bar__fill--estavel";
    }
  }

  badgeClass(status: StatusEstoqueNivel): string {
    switch (status) {
      case "critico":
        return "estoque-badge--critico";
      case "atencao":
        return "estoque-badge--atencao";
      default:
        return "estoque-badge--estavel";
    }
  }

  labelStatus(status: StatusEstoqueNivel): string {
    switch (status) {
      case "critico":
        return "Crítico";
      case "atencao":
        return "Atenção";
      default:
        return "Estável";
    }
  }

  iconWrapClass(index: number): string {
    return `estoque-prod-icon estoque-prod-icon--t${index % 8}`;
  }
}
