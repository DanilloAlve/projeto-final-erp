import {
  Component,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../services/auth';
import { API_URL } from '../../services/constants';
import { PageLayoutComponent } from '../layout/page-layout';
import { SummaryCardsComponent } from './sections/summary-cards/summary-cards';
import { DashboardChartsComponent } from './sections/dashboard-charts/dashboard-charts';
import { RecentActivitiesComponent } from './sections/recent-activities/recent-activities';
import { StockStatusComponent } from './sections/stock-status/stock-status';

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

type DashboardHistorico = {
  id: string;
  tabela: string;
  acao: string;
  referencia: string | null;
  dataModificacao: string;
};

export type StatusEstoqueNivel = 'critico' | 'atencao' | 'estavel';

export type LinhaStatusEstoque = {
  id: string;
  nome: string;
  skuLabel: string;
  codigo: string;
  categoriaNome: string;
  estoqueAtual: number;
  /** 0–100: atual / máximo (ou denominador sintético se não houver máximo) */
  barraPct: number;
  status: StatusEstoqueNivel;
  iconTintIndex: number;
};

const DASHBOARD_TIMEZONE = "America/Manaus";

function formatDateKeyInTimezone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    PageLayoutComponent,
    SummaryCardsComponent,
    DashboardChartsComponent,
    RecentActivitiesComponent,
    StockStatusComponent,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  currentUser = signal<any>(null);
  loading = signal(true);
  errorMessage = signal('');
  resumo = signal<DashboardResumo | null>(null);
  graficos = signal<DashboardGraficos | null>(null);
  historicosRecentes = signal<DashboardHistorico[]>([]);
  /** Até 5 produtos ativos mais recentemente atualizados */
  linhasStatusEstoque = signal<LinhaStatusEstoque[]>([]);

  constructor(
    private authService: AuthService,
    private http: HttpClient
  ) {
    this.currentUser.set(this.authService.getCurrentUser());
    void this.carregarDados();
  }

  readonly packageIconSrc = '/assets/menu/package.png';

  formatDataHistorico(data: string): string {
    const parsed = new Date(data);
    if (Number.isNaN(parsed.getTime())) {
      return "";
    }

    const now = new Date();
    const diffMs = now.getTime() - parsed.getTime();
    const diffMsAbs = Math.abs(diffMs);

    const diffMinutos = Math.floor(diffMsAbs / (1000 * 60));
    if (diffMinutos < 1) {
      return "Agora mesmo";
    }
    if (diffMinutos < 60) {
      return `Há ${diffMinutos} ${diffMinutos === 1 ? "minuto" : "minutos"} atrás`;
    }

    const diffHoras = Math.floor(diffMsAbs / (1000 * 60 * 60));
    if (diffHoras < 24) {
      return `Há ${diffHoras} ${diffHoras === 1 ? "hora" : "horas"} atrás`;
    }

    const hojeKey = formatDateKeyInTimezone(now, DASHBOARD_TIMEZONE);
    const ontemDate = new Date(now);
    ontemDate.setDate(ontemDate.getDate() - 1);
    const ontemKey = formatDateKeyInTimezone(ontemDate, DASHBOARD_TIMEZONE);
    const parsedKey = formatDateKeyInTimezone(parsed, DASHBOARD_TIMEZONE);

    if (parsedKey === ontemKey && parsedKey !== hojeKey) {
      const horaMinuto = new Intl.DateTimeFormat("pt-BR", {
        timeZone: DASHBOARD_TIMEZONE,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(parsed);
      return `Ontem, às ${horaMinuto}`;
    }

    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: DASHBOARD_TIMEZONE,
    }).format(parsed);
  }

  private mapProdutosStatusEstoque(sortedRaw: any[]): LinhaStatusEstoque[] {
    const rows: LinhaStatusEstoque[] = [];
    let rowIndex = 0;
    for (const p of sortedRaw) {
      const ativo = Boolean(p.ativo ?? true);
      if (!ativo) {
        continue;
      }
      const estoqueAtual = Number(p.estoque_atual ?? 0);
      const estoqueMinimo = Number(p.estoque_minimo ?? 0);
      const estoqueMaximo =
        p.estoque_maximo === null || p.estoque_maximo === undefined
          ? null
          : Number(p.estoque_maximo);

      const status = this.calcularStatusEstoque(estoqueAtual, estoqueMinimo, estoqueMaximo);
      const barraPct = this.calcularPctBarraEstoque(estoqueAtual, estoqueMinimo, estoqueMaximo);

      const id = String(p.id_prod ?? p.id ?? '');
      const codigo = String(p.codigo ?? '');
      const nome = String(p.nome ?? '');
      const categoriaNome = p.categoria?.nome != null ? String(p.categoria.nome) : '—';

      rows.push({
        id,
        nome,
        skuLabel: codigo ? `#SKU - ${codigo}` : '#SKU —',
        codigo: codigo || '—',
        categoriaNome,
        estoqueAtual,
        barraPct,
        status,
        iconTintIndex: rowIndex++,
      });

      if (rows.length >= 5) {
        break;
      }
    }

    return rows;
  }

  /**
   * Crítico: até 20% acima do estoque mínimo (atual ≤ mínimo × 1,2).
   * Atenção: estoque menor que 50% da média entre mínimo e máximo (sem máximo: média usa só o mínimo).
   */
  private calcularStatusEstoque(
    atual: number,
    minimo: number,
    maximo: number | null
  ): StatusEstoqueNivel {
    const maxRef =
      maximo !== null && maximo > 0 ? maximo : minimo;
    const media = (minimo + maxRef) / 2;
    const limiteAtencao = 0.5 * media;

    if (minimo > 0 && atual <= minimo * 1.2) {
      return 'critico';
    }
    if (atual < limiteAtencao) {
      return 'atencao';
    }
    return 'estavel';
  }

  private calcularPctBarraEstoque(
    atual: number,
    minimo: number,
    maximo: number | null
  ): number {
    const denom =
      maximo !== null && maximo > 0
        ? maximo
        : Math.max(minimo > 0 ? minimo * 2 : 0, atual, 1);
    if (denom <= 0) {
      return 0;
    }
    return Math.min(100, Math.round((atual / denom) * 1000) / 10);
  }

  private async carregarDados() {
    try {
      this.loading.set(true);
      this.errorMessage.set('');
      const [resumoData, graficosData, historicosData, produtosRaw] = await Promise.all([
        firstValueFrom(this.http.get<DashboardResumo>(`${API_URL}/dashboard/resumo`)),
        firstValueFrom(this.http.get<DashboardGraficos>(`${API_URL}/dashboard/graficos`)),
        firstValueFrom(this.http.get<DashboardHistorico[]>(`${API_URL}/dashboard/historicos-recentes`)),
        firstValueFrom(this.http.get<any[]>(`${API_URL}/produtos`)),
      ]);
      this.resumo.set(resumoData);
      this.graficos.set(graficosData);
      this.historicosRecentes.set(Array.isArray(historicosData) ? historicosData : []);
      const lista = Array.isArray(produtosRaw)
        ? produtosRaw.filter((p) => Boolean(p.ativo ?? true))
        : [];
      lista.sort((a, b) => {
        const da = a?.updated_at ? new Date(a.updated_at).getTime() : 0;
        const db = b?.updated_at ? new Date(b.updated_at).getTime() : 0;
        return db - da;
      });
      this.linhasStatusEstoque.set(this.mapProdutosStatusEstoque(lista));
    } catch (e) {
      console.error('Erro ao carregar dashboard:', e);
      this.errorMessage.set('Não foi possível carregar os indicadores.');
      this.resumo.set(null);
      this.graficos.set(null);
      this.historicosRecentes.set([]);
      this.linhasStatusEstoque.set([]);
    } finally {
      this.loading.set(false);
    }
  }
}
