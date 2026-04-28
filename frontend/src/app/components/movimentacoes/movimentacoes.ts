import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { API_URL } from '../../services/constants';
import { isHandledValidationError } from '../../services/http-error.utils';
import { MessageService } from '../../services/message.service';
import { PageLayoutComponent } from '../layout/page-layout';

type TipoMovimentacao = 'entrada' | 'saida';
type MotivoMovimentacao = 'compra' | 'devolucao' | 'ajuste' | 'venda' | 'consumo' | 'fabricacao';

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
  salvando = signal(false);
  mostraModal = signal(false);
  buscandoProdutos = signal(false);
  autocompleteAberto = signal(false);
  errorMessage = signal('');

  produtosAutocomplete = signal<ProdutoResumo[]>([]);
  movimentacoes = signal<Movimentacao[]>([]);

  filtroBuscaPeca = signal('');
  filtroTipo = signal<'todos' | TipoMovimentacao>('todos');
  filtroUsuario = signal('');
  filtroDataInicio = signal('');
  filtroDataFim = signal('');

  formProdutoId = signal('');
  formProdutoBusca = signal('');
  formTipo = signal<TipoMovimentacao>('entrada');
  formMotivo = signal<MotivoMovimentacao>('compra');
  formQuantidade = signal<number>(1);
  formObservacao = signal('');
  private produtoBuscaTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private http: HttpClient
  ) {
    this.carregarInicial();
  }

  async carregarInicial() {
    await this.carregarMovimentacoes();
  }

  resetFormulario() {
    this.formProdutoId.set('');
    this.formProdutoBusca.set('');
    this.formTipo.set('entrada');
    this.formMotivo.set('compra');
    this.formQuantidade.set(1);
    this.formObservacao.set('');
    this.produtosAutocomplete.set([]);
    this.autocompleteAberto.set(false);
  }

  abrirModalNova() {
    this.resetFormulario();
    this.mostraModal.set(true);
  }

  fecharModal() {
    this.mostraModal.set(false);
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

  private produtoDisplayLabel(produto: ProdutoResumo): string {
    return `${produto.nome} (${produto.codigo})`;
  }

  onProdutoBuscaChange(valor: string) {
    this.formProdutoBusca.set(valor);
    this.formProdutoId.set('');

    if (this.produtoBuscaTimer) {
      clearTimeout(this.produtoBuscaTimer);
    }

    const termo = valor.trim();
    if (termo.length < 2) {
      this.produtosAutocomplete.set([]);
      this.autocompleteAberto.set(false);
      return;
    }

    this.produtoBuscaTimer = setTimeout(() => {
      void this.buscarProdutosAutocomplete(termo);
    }, 300);
  }

  onProdutoBuscaFocus() {
    if (this.produtosAutocomplete().length > 0) {
      this.autocompleteAberto.set(true);
    }
  }

  onProdutoBuscaBlur() {
    setTimeout(() => {
      this.autocompleteAberto.set(false);
    }, 150);
  }

  selecionarProdutoAutocomplete(produto: ProdutoResumo) {
    this.formProdutoId.set(produto.id);
    this.formProdutoBusca.set(this.produtoDisplayLabel(produto));
    this.autocompleteAberto.set(false);
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

  async buscarProdutosAutocomplete(termo: string) {
    try {
      this.buscandoProdutos.set(true);
      const response = await firstValueFrom(
        this.http.get<any>(`${API_URL}/produtos`, {
          params: {
            nome: termo,
            page: '1',
            limit: '12',
          },
        })
      );
      const raw = Array.isArray(response) ? response : response?.data;
      const list = Array.isArray(raw)
        ? raw
            .map((p) => this.mapApiProduto(p))
            .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }))
        : [];
      this.produtosAutocomplete.set(list);
      this.autocompleteAberto.set(list.length > 0);
    } catch (error) {
      console.error('Erro ao buscar produtos por autocomplete:', error);
      this.produtosAutocomplete.set([]);
      this.autocompleteAberto.set(false);
    } finally {
      this.buscandoProdutos.set(false);
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

  atualizarTipo(tipo: TipoMovimentacao) {
    this.formTipo.set(tipo);
    if (tipo === 'saida' && this.formMotivo() === 'compra') {
      this.formMotivo.set('venda');
    }
    if (tipo === 'saida' && this.formMotivo() === 'fabricacao') {
      this.formMotivo.set('consumo');
    }
    if (tipo === 'entrada' && this.formMotivo() === 'venda') {
      this.formMotivo.set('compra');
    }
    if (tipo === 'entrada' && this.formMotivo() === 'consumo') {
      this.formMotivo.set('fabricacao');
    }
  }

  get motivosPorTipo(): MotivoMovimentacao[] {
    if (this.formTipo() === 'entrada') {
      return ['compra', 'devolucao', 'ajuste', 'fabricacao'];
    }
    return ['venda', 'devolucao', 'ajuste', 'consumo'];
  }

  private validarFormularioCadastro() {
    const produtoId = this.formProdutoId();
    const quantidade = Number(this.formQuantidade());
    const motivo = this.formMotivo();

    if (!produtoId) {
      return 'Selecione uma peça.';
    }
    if (!Number.isFinite(quantidade) || quantidade <= 0) {
      return 'Informe uma quantidade maior que zero.';
    }
    if (!this.motivosPorTipo.includes(motivo)) {
      return 'Selecione um motivo compatível com o tipo da movimentação.';
    }
    return '';
  }

  async cadastrarMovimentacao() {
    const erroValidacao = this.validarFormularioCadastro();
    if (erroValidacao) {
      await MessageService.validationError(erroValidacao);
      return;
    }

    try {
      this.salvando.set(true);
      const payload: {
        produtoId: string;
        tipo: TipoMovimentacao;
        quantidade: number;
        motivo: MotivoMovimentacao;
        observacao?: string;
      } = {
        produtoId: this.formProdutoId(),
        tipo: this.formTipo(),
        quantidade: Number(this.formQuantidade()),
        motivo: this.formMotivo(),
      };

      const observacao = this.formObservacao().trim();
      if (observacao) {
        payload.observacao = observacao;
      }

      await firstValueFrom(this.http.post(`${API_URL}/movimentacoes`, payload));
      await MessageService.success('Movimentação cadastrada com sucesso.');
      this.resetFormulario();
      this.fecharModal();
      await this.carregarMovimentacoes();
    } catch (error) {
      console.error('Erro ao cadastrar movimentação:', error);
      if (isHandledValidationError(error)) return;
      const mensagem = MessageService.extractErrorMessage(error, 'Erro ao cadastrar movimentação');
      await MessageService.error(mensagem);
    } finally {
      this.salvando.set(false);
    }
  }

  private motivoLabel(tipo: TipoMovimentacao, motivo: MotivoMovimentacao): string {
    if (tipo === 'entrada') {
      if (motivo === 'compra') return 'Compra de fornecedor';
      if (motivo === 'devolucao') return 'Devolução de linha';
      if (motivo === 'ajuste') return 'Ajuste de inventário (positivo)';
      if (motivo === 'venda') return 'Venda';
      if (motivo === 'fabricacao') return 'Fabricação';
    }

    if (motivo === 'venda') return 'Venda';
    if (motivo === 'consumo') return 'Consumo';
    if (motivo === 'fabricacao') return 'Consumo';
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
