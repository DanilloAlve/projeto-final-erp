import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";

type DashboardHistorico = {
  id: string;
  tabela: string;
  acao: string;
  referencia: string | null;
  dataModificacao: string;
};

@Component({
  selector: "app-recent-activities",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./recent-activities.html",
  styleUrl: "./recent-activities.css",
})
export class RecentActivitiesComponent {
  @Input({ required: true }) loading = true;
  @Input() historicosRecentes: DashboardHistorico[] = [];
  @Input({ required: true }) formatDataHistorico!: (data: string) => string;
}
