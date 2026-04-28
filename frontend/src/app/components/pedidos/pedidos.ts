import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { API_URL } from '../../services/constants';
import { AuthService } from '../../services/auth';
import { isHandledValidationError } from '../../services/http-error.utils';
import { MessageService } from '../../services/message.service';
import { PageLayoutComponent } from '../layout/page-layout';
import { CurrencyInputComponent } from '../currency-input/currency-input';

export type PedidoStatus = 'aberto' | 'pago' | 'cancelado';

export interface ItemPedidoView {
  id: number;
  produtoNome: string;
  quantidade: number;
  preco_unitario: number;
}

export interface PedidoView {
  id: string;
  codigo: string;
  clienteNome: string;
  usuarioNome: string;
  total: number;
  status: PedidoStatus;
  created_at?: string;
  itens: ItemPedidoView[];
}

type ClienteOption = {
  id: number;
  nome: string;
};

type ProdutoOption = {
  id: string;
  nome: string;
  preco: number;
};

type LinhaItemForm = {
  produtoId: string;
  quantidade: number;
  preco_unitario: number;
};

type NovoPedidoForm = {
  clienteId: string;
  linhas: LinhaItemForm[];
};

@Component({
  selector: 'app-pedidos',
  imports: [CommonModule, FormsModule, PageLayoutComponent, CurrencyInputComponent],
  templateUrl: './pedidos.html',
  styleUrl: './pedidos.css',
})
export class Pedidos {
  loading = signal(false);
  errorMessage = signal('');

  mostraModalNovo = signal(false);
  mostraModalDetalhe = signal(false);
  salvando = signal(false);
  excluindo = signal(false);
  atualizandoStatus = signal(false);

  filtroStatus = signal<'todos' | PedidoStatus>('todos');

  pedidos: PedidoView[] = [];
  pedidosFiltrados: PedidoView[] = [];
  clientes: ClienteOption[] = [];
  produtos: ProdutoOption[] = [];

  pedidoDetalhe = signal<PedidoView | null>(null);
  statusEdicao = signal<PedidoStatus>('aberto');

  formularioNovo = signal<NovoPedidoForm>({
    clienteId: '',
    linhas: [{ produtoId: '', quantidade: 1, preco_unitario: 0 }],
  });

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) {
    void this.carregarPedidos();
    void this.carregarClientes();
    void this.carregarProdutos();
  }

  private mapApiPedido(p: any): PedidoView {
    const itensRaw = Array.isArray(p.itens) ? p.itens : [];
    const itens: ItemPedidoView[] = itensRaw.map((i: any) => ({
      id: Number(i.id),
      produtoNome: i.produto?.nome ?? '—',
      quantidade: Number(i.quantidade ?? 0),
      preco_unitario: Number(i.preco_unitario ?? 0),
    }));

    return {
      id: String(p.id),
      codigo: String(p.codigo ?? '----'),
      clienteNome: p.cliente?.nome ?? '—',
      usuarioNome: p.usuario?.nome ?? '—',
      total: Number(p.total ?? 0),
      status: (p.status as PedidoStatus) ?? 'aberto',
      created_at: p.created_at ?? undefined,
      itens,
    };
  }

  private aplicarFiltro() {
    const f = this.filtroStatus();
    if (f === 'todos') {
      this.pedidosFiltrados = [...this.pedidos];
      return;
    }
    this.pedidosFiltrados = this.pedidos.filter((x) => x.status === f);
  }

  onFiltroStatusChange(valor: string) {
    if (valor === 'todos' || valor === 'aberto' || valor === 'pago' || valor === 'cancelado') {
      this.filtroStatus.set(valor);
      this.aplicarFiltro();
    }
  }

  async carregarPedidos() {
    try {
      this.loading.set(true);
      this.errorMessage.set('');
      const response = await firstValueFrom(this.http.get<any[]>(`${API_URL}/pedidos`));
      this.pedidos = Array.isArray(response) ? response.map((p) => this.mapApiPedido(p)) : [];
      this.aplicarFiltro();
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
      this.errorMessage.set('Erro ao carregar pedidos');
    } finally {
      this.loading.set(false);
    }
  }

  private mapApiCliente(c: any): ClienteOption {
    return {
      id: Number(c.id),
      nome: c.nome,
    };
  }

  async carregarClientes() {
    try {
      const response = await firstValueFrom(this.http.get<any[]>(`${API_URL}/clientes`));
      this.clientes = Array.isArray(response) ? response.map((c) => this.mapApiCliente(c)) : [];
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      this.clientes = [];
    }
  }

  private mapApiProduto(pr: any): ProdutoOption {
    return {
      id: String(pr.id_prod ?? pr.id),
      nome: pr.nome,
      preco: Number(pr.preco ?? 0),
    };
  }

  async carregarProdutos() {
    try {
      const response = await firstValueFrom(this.http.get<any[]>(`${API_URL}/produtos`));
      this.produtos = Array.isArray(response) ? response.map((pr) => this.mapApiProduto(pr)) : [];
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      this.produtos = [];
    }
  }

  labelStatus(s: PedidoStatus): string {
    const map: Record<PedidoStatus, string> = {
      aberto: 'Aberto',
      pago: 'Pago',
      cancelado: 'Cancelado',
    };
    return map[s] ?? s;
  }

  classeStatus(s: PedidoStatus): string {
    if (s === 'pago') return 'status-pago';
    if (s === 'cancelado') return 'status-cancelado';
    return 'status-aberto';
  }

  abrirModalNovo() {
    void this.carregarClientes();
    void this.carregarProdutos();
    this.formularioNovo.set({
      clienteId: '',
      linhas: [{ produtoId: '', quantidade: 1, preco_unitario: 0 }],
    });
    this.mostraModalNovo.set(true);
  }

  fecharModalNovo() {
    this.mostraModalNovo.set(false);
  }

  private atualizarFormNovo(mut: (draft: NovoPedidoForm) => void) {
    const atual = this.formularioNovo();
    const copia: NovoPedidoForm = {
      clienteId: atual.clienteId,
      linhas: atual.linhas.map((l) => ({ ...l })),
    };
    mut(copia);
    this.formularioNovo.set(copia);
  }

  onClienteNovoChange(valor: string) {
    this.atualizarFormNovo((d) => {
      d.clienteId = valor;
    });
  }

  adicionarLinha() {
    this.atualizarFormNovo((d) => {
      d.linhas.push({ produtoId: '', quantidade: 1, preco_unitario: 0 });
    });
  }

  removerLinha(index: number) {
    this.atualizarFormNovo((d) => {
      if (d.linhas.length <= 1) return;
      d.linhas.splice(index, 1);
    });
  }

  onProdutoLinhaChange(index: number, produtoId: string) {
    const pr = this.produtos.find((p) => p.id === produtoId);
    this.atualizarFormNovo((d) => {
      const linha = d.linhas[index];
      if (!linha) return;
      linha.produtoId = produtoId;
      if (pr) {
        linha.preco_unitario = pr.preco;
      }
    });
  }

  onQuantidadeLinhaChange(index: number, valor: string | number) {
    const n = typeof valor === 'number' ? valor : Number(valor);
    this.atualizarFormNovo((d) => {
      const linha = d.linhas[index];
      if (!linha) return;
      linha.quantidade = Number.isFinite(n) && n > 0 ? Math.floor(n) : 1;
    });
  }

  onPrecoLinhaChange(index: number, valor: string | number) {
    const n = typeof valor === 'number' ? valor : Number(valor);
    this.atualizarFormNovo((d) => {
      const linha = d.linhas[index];
      if (!linha) return;
      linha.preco_unitario = Number.isFinite(n) && n >= 0 ? n : 0;
    });
  }

  abrirModalDetalhe(p: PedidoView) {
    this.pedidoDetalhe.set(p);
    this.statusEdicao.set(p.status);
    this.mostraModalDetalhe.set(true);
  }

  fecharModalDetalhe() {
    this.mostraModalDetalhe.set(false);
    this.pedidoDetalhe.set(null);
  }

  async salvarNovoPedido() {
    const user = this.auth.currentUser();
    const uid = user?.id?.trim();
    if (!uid) {
      void MessageService.validationError('Sessão inválida. Faça login novamente.');
      return;
    }

    const form = this.formularioNovo();
    const clienteId = Number(form.clienteId);
    if (!Number.isFinite(clienteId) || clienteId <= 0) {
      void MessageService.validationError('Selecione um cliente');
      return;
    }

    const linhasValidas = form.linhas.filter((l) => l.produtoId.trim() && l.quantidade > 0 && l.preco_unitario > 0);
    if (linhasValidas.length === 0) {
      void MessageService.validationError('Inclua ao menos um item com produto, quantidade e preço');
      return;
    }

    try {
      this.salvando.set(true);

      const criado = await firstValueFrom(
        this.http.post<any>(`${API_URL}/pedidos`, {
          clienteId,
          usuarioId: uid,
          total: 0,
          status: 'aberto',
          itens: [],
        })
      );

      const pedidoId = String(criado?.id ?? '');
      if (!pedidoId) {
        throw new Error('Resposta inválida ao criar pedido');
      }

      try {
        for (const linha of linhasValidas) {
          await firstValueFrom(
            this.http.post(`${API_URL}/itens-pedido`, {
              pedidoId,
              produtoId: linha.produtoId.trim(),
              quantidade: linha.quantidade,
              preco_unitario: linha.preco_unitario,
            })
          );
        }
      } catch (itemErr) {
        try {
          await firstValueFrom(this.http.delete(`${API_URL}/pedidos/${pedidoId}`));
        } catch {
          void MessageService.error(
            'Pedido criado parcialmente e não foi possível desfazer. Verifique o pedido em aberto.'
          );
        }
        throw itemErr;
      }

      await this.carregarPedidos();
      await MessageService.success('Pedido criado com sucesso');
      this.fecharModalNovo();
    } catch (error) {
      console.error('Erro ao salvar pedido:', error);
      if (isHandledValidationError(error)) return;
      const message = MessageService.extractErrorMessage(error, 'Erro ao salvar pedido');
      void MessageService.error(message);
    } finally {
      this.salvando.set(false);
    }
  }

  async salvarStatusPedido() {
    const p = this.pedidoDetalhe();
    if (!p) return;

    const novo = this.statusEdicao();
    if (novo === p.status) {
      this.fecharModalDetalhe();
      return;
    }

    try {
      this.atualizandoStatus.set(true);
      await firstValueFrom(this.http.patch(`${API_URL}/pedidos/${p.id}/status`, { status: novo }));
      await this.carregarPedidos();
      await MessageService.success('Status atualizado');
      this.fecharModalDetalhe();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      if (isHandledValidationError(error)) return;
      const message = MessageService.extractErrorMessage(error, 'Erro ao atualizar status');
      void MessageService.error(message);
    } finally {
      this.atualizandoStatus.set(false);
    }
  }

  podePagarPedido(statusAtual: PedidoStatus): boolean {
    return statusAtual === 'aberto';
  }

  podeCancelarPedido(statusAtual: PedidoStatus): boolean {
    return statusAtual === 'aberto';
  }

  async pagarPedido(p: PedidoView) {
    await this.atualizarStatusPedidoLista(p, 'pago');
  }

  async cancelarPedido(p: PedidoView) {
    await this.atualizarStatusPedidoLista(p, 'cancelado');
  }

  private async atualizarStatusPedidoLista(p: PedidoView, status: PedidoStatus) {
    if (p.status === status) return;
    const acao = status === 'pago' ? 'pagar' : 'cancelar';
    const ok = await MessageService.confirmAction(`Tem certeza que deseja ${acao} este pedido?`, {
      title: 'Confirma alteração de status',
      confirmButtonText: status === 'pago' ? 'Pagar' : 'Cancelar pedido',
      confirmButtonColor: status === 'pago' ? '#2e7d32' : '#dc2626',
    });
    if (!ok) return;

    try {
      this.atualizandoStatus.set(true);
      await firstValueFrom(this.http.patch(`${API_URL}/pedidos/${p.id}/status`, { status }));
      await this.carregarPedidos();
      await MessageService.success(`Pedido ${this.labelStatus(status).toLowerCase()} com sucesso`);
    } catch (error) {
      console.error('Erro ao atualizar status do pedido:', error);
      if (isHandledValidationError(error)) return;
      const message = MessageService.extractErrorMessage(error, 'Erro ao atualizar status do pedido');
      void MessageService.error(message);
    } finally {
      this.atualizandoStatus.set(false);
    }
  }

  async excluirPedido(p: PedidoView) {
    await this.excluirPedidoPorId(p.id);
  }

  private async excluirPedidoPorId(id: string) {
    const ok = await MessageService.confirmDelete('Tem certeza que deseja excluir este pedido?');
    if (!ok) return;

    try {
      this.excluindo.set(true);
      await firstValueFrom(this.http.delete(`${API_URL}/pedidos/${id}`));
      await this.carregarPedidos();
      this.fecharModalDetalhe();
      await MessageService.success('Pedido excluído');
    } catch (error) {
      console.error('Erro ao excluir pedido:', error);
      if (isHandledValidationError(error)) return;
      const message = MessageService.extractErrorMessage(error, 'Erro ao excluir pedido');
      void MessageService.error(message);
    } finally {
      this.excluindo.set(false);
    }
  }

  podeAlterarStatus(statusAtual: PedidoStatus): boolean {
    return statusAtual === 'aberto';
  }

  podeExcluirPedido(statusAtual: PedidoStatus): boolean {
    return statusAtual !== 'pago';
  }

  mensagemListaVazia(): string {
    if (this.pedidos.length === 0) {
      return 'Nenhum pedido cadastrado. Clique em "+ Novo Pedido" para começar.';
    }
    return 'Nenhum pedido corresponde ao status selecionado.';
  }

  onStatusEdicaoChange(valor: string) {
    if (valor === 'aberto' || valor === 'pago' || valor === 'cancelado') {
      this.statusEdicao.set(valor);
    }
  }
}
