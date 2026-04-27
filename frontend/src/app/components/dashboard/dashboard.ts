import {
  Component,
  DestroyRef,
  ElementRef,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
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
} from 'chart.js';
import { AuthService } from '../../services/auth';
import { API_URL } from '../../services/constants';
import { PageLayoutComponent } from '../layout/page-layout';

Chart.register(
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  ArcElement,
  DoughnutController,
);

type DashboardResumo = {
  vendasMesAtual: number;
  produtosAtivos: number;
  totalClientes: number;
  crescimentoPercentual: number;
};

type DashboardGraficos = {
  vendasPorMes: { labelMes: string; valor: number }[];
  produtosPorCategoria: { categoriaNome: string; quantidade: number }[];
};

/**
 * Ordem: primários da UI (navy + ciano de destaque), depois tons que contrastam
 * fortemente entre si e com fundo claro (#f5f7fa / branco dos cards).
 */
const CORES_PRIMARIAS_CONTRASTE = [
  '#0a3d5c',
  '#00d4ff',
  '#1565a3',
  '#ff5722',
  '#ffc107',
  '#e91e63',
  '#00c853',
  '#7c4dff',
] as const;

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, PageLayoutComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  private readonly destroyRef = inject(DestroyRef);

  currentUser = signal<any>(null);
  loading = signal(true);
  errorMessage = signal('');
  resumo = signal<DashboardResumo | null>(null);
  graficos = signal<DashboardGraficos | null>(null);

  vendasCanvas = viewChild<ElementRef<HTMLCanvasElement>>('vendasChart');
  produtosCanvas = viewChild<ElementRef<HTMLCanvasElement>>('produtosChart');

  private chartVendas?: Chart<'bar'>;
  private chartProdutos?: Chart<'doughnut'>;

  constructor(
    private authService: AuthService,
    private http: HttpClient
  ) {
    this.currentUser.set(this.authService.getCurrentUser());
    void this.carregarDados();

    this.destroyRef.onDestroy(() => {
      this.chartVendas?.destroy();
      this.chartProdutos?.destroy();
    });

    effect(() => {
      const g = this.graficos();
      const cv = this.vendasCanvas()?.nativeElement;
      const cp = this.produtosCanvas()?.nativeElement;
      if (!g || !cv) {
        return;
      }
      queueMicrotask(() => {
        this.renderVendas(cv, g.vendasPorMes);
        if (cp && g.produtosPorCategoria.length > 0) {
          this.renderProdutos(cp, g.produtosPorCategoria);
        } else {
          this.chartProdutos?.destroy();
          this.chartProdutos = undefined;
        }
      });
    });
  }

  formatCrescimento(valor: number | undefined): string {
    const v = valor ?? 0;
    const formatted = new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(v);
    const prefix = v > 0 ? '+' : '';
    return `${prefix}${formatted}%`;
  }

  private formatBrl(v: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(v);
  }

  private renderVendas(canvas: HTMLCanvasElement, pontos: { labelMes: string; valor: number }[]) {
    this.chartVendas?.destroy();

    const labels = pontos.map((p) => p.labelMes);
    const valores = pontos.map((p) => p.valor);
    const coresBarras = valores.map(
      (_, i) => CORES_PRIMARIAS_CONTRASTE[i % CORES_PRIMARIAS_CONTRASTE.length]
    );

    this.chartVendas = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Vendas',
            data: valores,
            backgroundColor: coresBarras,
            borderColor: '#ffffff',
            borderWidth: 2,
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => this.formatBrl(Number(ctx.raw)),
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { maxRotation: 45, minRotation: 0 },
          },
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) =>
                new Intl.NumberFormat('pt-BR', {
                  notation: 'compact',
                  compactDisplay: 'short',
                }).format(Number(value)),
            },
          },
        },
      },
    });
  }

  private renderProdutos(
    canvas: HTMLCanvasElement,
    pontos: { categoriaNome: string; quantidade: number }[]
  ) {
    this.chartProdutos?.destroy();

    const labels = pontos.map((p) => p.categoriaNome);
    const valores = pontos.map((p) => p.quantidade);
    const cores = pontos.map(
      (_, i) => CORES_PRIMARIAS_CONTRASTE[i % CORES_PRIMARIAS_CONTRASTE.length]
    );

    this.chartProdutos = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [
          {
            data: valores,
            backgroundColor: cores,
            borderWidth: 3,
            borderColor: '#ffffff',
            hoverBorderColor: '#0a3d5c',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              boxWidth: 14,
              padding: 12,
              font: { size: 12 },
              color: '#333333',
              usePointStyle: true,
              pointStyle: 'rectRounded',
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

  private async carregarDados() {
    try {
      this.loading.set(true);
      this.errorMessage.set('');
      const [resumoData, graficosData] = await Promise.all([
        firstValueFrom(this.http.get<DashboardResumo>(`${API_URL}/dashboard/resumo`)),
        firstValueFrom(this.http.get<DashboardGraficos>(`${API_URL}/dashboard/graficos`)),
      ]);
      this.resumo.set(resumoData);
      this.graficos.set(graficosData);
    } catch (e) {
      console.error('Erro ao carregar dashboard:', e);
      this.errorMessage.set('Não foi possível carregar os indicadores.');
      this.resumo.set(null);
      this.graficos.set(null);
    } finally {
      this.loading.set(false);
    }
  }
}
