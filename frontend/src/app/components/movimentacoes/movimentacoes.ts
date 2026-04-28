import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { API_URL } from '../../services/constants';
import { PageLayoutComponent } from '../layout/page-layout';

type TipoMovimentacao = 'entrada' | 'saida';
type MotivoMovimentacao = 'compra' | 'devolucao' | 'ajuste' | 'venda';

type ProdutoResumo = {
  id: string;
  nome: string;
  codigo: string;
  estoque_atual: number;
  estoque_minimo: number;
  estoque_maximo: number | null;
};

type UsuarioResumo = {
  id: string;
  nome: string;
};

type Movimentacao = {
  id: string;
  created_at: string;
  tipo: TipoMovimentacao;
  motivo: MotivoMovimentacao;
  quantidade: number;
  observacao?: string;
  produto: ProdutoResumo;
  usuario: UsuarioResumo;
};

@Component({
  selector: 'app-movimentacoes',
  imports: [CommonModule, FormsModule, PageLayoutComponent],
  templateUrl: './movimentacoes.html',
  styleUrl: './movimentacoes.css',
})
export class Movimentacoes {
  loading = signal(false);
  errorMessage = signal('');

  produtos = signal<ProdutoResumo[]>([]);
  movimentacoes = signal<Movimentacao[]>([]);

  filtroBuscaPeca = signal('');
  filtroTipo = signal<'todos' | TipoMovimentacao>('todos');
  filtroUsuario = signal('');
  filtroDataInicio = signal('');
  filtroDataFim = signal('');

  constructor(
    private http: HttpClient
  ) {
    this.carregarInicial();
  }

  async carregarInicial() {
    await Promise.all([this.carregarProdutos(), this.carregarMovimentacoes()]);
  }

  private mapApiProduto(p: any): ProdutoResumo {
    return {
      id: p.id_prod ?? p.id,
      nome: p.nome,
      codigo: p.codigo,
      estoque_atual: Number(p.estoque_atual ?? 0),
      estoque_minimo: Number(p.estoque_minimo ?? 0),
      estoque_maximo: p.estoque_maximo === null || p.estoque_maximo === undefined ? null : Number(p.estoque_maximo),
    };
  }

  private mapApiMovimentacao(m: any): Movimentacao {
    return {
      id: m.id,
      created_at: m.created_at,
      tipo: m.tipo,
      motivo: m.motivo,
      quantidade: Number(m.quantidade),
      observacao: m.observacao ?? undefined,
      produto: {
        id: m.produto?.id_prod ?? m.produto?.id,
        nome: m.produto?.nome,
        codigo: m.produto?.codigo,
        estoque_atual: Number(m.produto?.estoque_atual ?? 0),
        estoque_minimo: Number(m.produto?.estoque_minimo ?? 0),
        estoque_maximo:
          m.produto?.estoque_maximo === null || m.produto?.estoque_maximo === undefined
            ? null
            : Number(m.produto?.estoque_maximo),
      },
      usuario: {
        id: m.usuario?.id_user ?? m.usuario?.id,
        nome: m.usuario?.nome,
      },
    };
  }

  async carregarProdutos() {
    try {
      this.loading.set(true);
      this.errorMessage.set('');
      const response = await firstValueFrom(this.http.get<any[]>(`${API_URL}/produtos`));
      const list = Array.isArray(response) ? response.map((p) => this.mapApiProduto(p)) : [];
      this.produtos.set(list);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      this.errorMessage.set('Erro ao carregar produtos');
    } finally {
      this.loading.set(false);
    }
  }

  async carregarMovimentacoes() {
    try {
      this.loading.set(true);
      this.errorMessage.set('');
      const response = await firstValueFrom(this.http.get<any>(`${API_URL}/movimentacoes`));
      const raw = Array.isArray(response) ? response : response?.data;
      const list = Array.isArray(raw) ? raw.map((m) => this.mapApiMovimentacao(m)) : [];
      this.movimentacoes.set(list);
    } catch (error) {
      console.error('Erro ao carregar movimentações:', error);
      this.errorMessage.set('Erro ao carregar movimentações');
    } finally {
      this.loading.set(false);
    }
  }

  private motivoLabel(tipo: TipoMovimentacao, motivo: MotivoMovimentacao): string {
    if (tipo === 'entrada') {
      if (motivo === 'compra') return 'Compra de fornecedor';
      if (motivo === 'devolucao') return 'Devolução de linha';
      if (motivo === 'ajuste') return 'Ajuste de inventário (positivo)';
      if (motivo === 'venda') return 'Movimento (venda)';
    }

    if (motivo === 'venda') return 'Uso na linha de produção';
    if (motivo === 'ajuste') return 'Avaria / perda / ajuste de inventário (negativo)';
    if (motivo === 'devolucao') return 'Devolução';
    if (motivo === 'compra') return 'Compra';
    return motivo;
  }

  formatDateTime(value: string) {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString('pt-BR', { timeZone: 'America/Manaus' });
  }

  private matchesPeriodo(createdAt: string) {
    const inicio = this.filtroDataInicio();
    const fim = this.filtroDataFim();
    if (!inicio && !fim) return true;

    const d = new Date(createdAt);
    if (Number.isNaN(d.getTime())) return true;

    if (inicio) {
      const di = new Date(`${inicio}T00:00:00`);
      if (d < di) return false;
    }
    if (fim) {
      const df = new Date(`${fim}T23:59:59`);
      if (d > df) return false;
    }
    return true;
  }

  get movimentacoesFiltradas(): (Movimentacao & { motivoLabel: string })[] {
    const buscaPeca = this.filtroBuscaPeca().trim().toLowerCase();
    const tipo = this.filtroTipo();
    const buscaUsuario = this.filtroUsuario().trim().toLowerCase();

    return this.movimentacoes()
      .filter((m) => {
        if (tipo !== 'todos' && m.tipo !== tipo) return false;
        if (buscaPeca) {
          const pNome = (m.produto?.nome ?? '').toLowerCase();
          const pCod = (m.produto?.codigo ?? '').toLowerCase();
          if (!pNome.includes(buscaPeca) && !pCod.includes(buscaPeca)) return false;
        }
        if (buscaUsuario) {
          const uNome = (m.usuario?.nome ?? '').toLowerCase();
          if (!uNome.includes(buscaUsuario)) return false;
        }
        if (!this.matchesPeriodo(m.created_at)) return false;
        return true;
      })
      .map((m) => ({
        ...m,
        motivoLabel: this.motivoLabel(m.tipo, m.motivo),
      }));
  }


}
