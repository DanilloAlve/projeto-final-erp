import { CommonModule } from "@angular/common";
import {
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  DoughnutController,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";
import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from "@angular/core";

type DashboardGraficos = {
  vendasPorMes: { labelMes: string; valor: number }[];
  produtosPorCategoria: { categoriaNome: string; quantidade: number }[];
};

const CORES_PRIMARIAS_CONTRASTE = [
  "#0a3d5c",
  "#00d4ff",
  "#1565a3",
  "#ff5722",
  "#ffc107",
  "#e91e63",
  "#00c853",
  "#7c4dff",
] as const;

Chart.register(
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  ArcElement,
  DoughnutController
);

@Component({
  selector: "app-dashboard-charts",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./dashboard-charts.html",
  styleUrl: "./dashboard-charts.css",
})
export class DashboardChartsComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input({ required: true }) loading = true;
  @Input() graficos: DashboardGraficos | null = null;

  @ViewChild("vendasChart") vendasCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild("produtosChart") produtosCanvas?: ElementRef<HTMLCanvasElement>;

  private chartVendas?: Chart<"bar">;
  private chartProdutos?: Chart<"doughnut">;
  private viewReady = false;

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.renderCharts();
  }

  ngOnChanges(_changes: SimpleChanges): void {
    this.renderCharts();
  }

  ngOnDestroy(): void {
    this.chartVendas?.destroy();
    this.chartProdutos?.destroy();
  }

  private renderCharts(): void {
    if (!this.viewReady || this.loading || !this.graficos) {
      return;
    }
    queueMicrotask(() => {
      const cv = this.vendasCanvas?.nativeElement;
      if (cv) {
        this.renderVendas(cv, this.graficos!.vendasPorMes);
      }
      const cp = this.produtosCanvas?.nativeElement;
      if (cp && this.graficos!.produtosPorCategoria.length > 0) {
        this.renderProdutos(cp, this.graficos!.produtosPorCategoria);
      } else {
        this.chartProdutos?.destroy();
        this.chartProdutos = undefined;
      }
    });
  }

  private formatBrl(v: number): string {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(v);
  }

  private renderVendas(canvas: HTMLCanvasElement, pontos: { labelMes: string; valor: number }[]) {
    this.chartVendas?.destroy();
    const labels = pontos.map((p) => p.labelMes);
    const valores = pontos.map((p) => p.valor);
    const coresBarras = valores.map((_, i) => CORES_PRIMARIAS_CONTRASTE[i % CORES_PRIMARIAS_CONTRASTE.length]);

    this.chartVendas = new Chart(canvas, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: "Vendas",
          data: valores,
          backgroundColor: coresBarras,
          borderColor: "#ffffff",
          borderWidth: 2,
          borderRadius: 6,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (ctx) => this.formatBrl(Number(ctx.raw)) } },
        },
        scales: {
          x: { grid: { display: false }, ticks: { maxRotation: 45, minRotation: 0 } },
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) =>
                new Intl.NumberFormat("pt-BR", { notation: "compact", compactDisplay: "short" }).format(Number(value)),
            },
          },
        },
      },
    });
  }

  private renderProdutos(canvas: HTMLCanvasElement, pontos: { categoriaNome: string; quantidade: number }[]) {
    this.chartProdutos?.destroy();
    const labels = pontos.map((p) => p.categoriaNome);
    const valores = pontos.map((p) => p.quantidade);
    const cores = pontos.map((_, i) => CORES_PRIMARIAS_CONTRASTE[i % CORES_PRIMARIAS_CONTRASTE.length]);

    this.chartProdutos = new Chart(canvas, {
      type: "doughnut",
      data: {
        labels,
        datasets: [{
          data: valores,
          backgroundColor: cores,
          borderWidth: 3,
          borderColor: "#ffffff",
          hoverBorderColor: "#0a3d5c",
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "right",
            labels: {
              boxWidth: 14,
              padding: 12,
              font: { size: 12 },
              color: "#333333",
              usePointStyle: true,
              pointStyle: "rectRounded",
            },
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const total = (ctx.dataset.data as number[]).reduce((a, b) => a + b, 0);
                const v = Number(ctx.raw);
                const pct = total > 0 ? Math.round((v / total) * 100) : 0;
                return `${ctx.label}: ${v} (${pct}%)`;
              },
            },
          },
        },
      },
    });
  }
}
