import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { API_URL } from '../../services/constants';
import { AuthService } from '../../services/auth';
import { isHandledValidationError } from '../../services/http-error.utils';
import { MessageService } from '../../services/message.service';
import { PageLayoutComponent } from '../layout/page-layout';

type ClienteOption = { id: number; nome: string };
type ProdutoOption = { id: string; nome: string; preco: number };

interface ItemCarrinho {
  produtoId: string;
  nome: string;
  quantidade: number;
  preco_unitario: number;
}

type FormaPagamento = 'dinheiro' | 'cartao' | 'pix' | 'boleto';

@Component({
  selector: 'app-vendas',
  imports: [CommonModule, FormsModule, PageLayoutComponent],
  templateUrl: './vendas.html',
  styleUrl: './vendas.css',
})
export class Vendas {
  salvando = signal(false);

  clienteNome = signal('');
  clienteCpfCnpj = signal('');
  clienteSelecionadoId = signal('');

  pesquisaProduto = signal('');
  quantidadeAdd = signal(1);

  itensCarrinho = signal<ItemCarrinho[]>([]);
  formaPagamento = signal<FormaPagamento>('dinheiro');

  mostraModalPedido = signal(false);
  dataEntrega = signal('');

  clientes: ClienteOption[] = [];
  produtos: ProdutoOption[] = [];

  mostrarListaProdutos = signal(false);

  produtosFiltrados = computed(() => {
    if (!this.mostrarListaProdutos()) return [];
    const termo = this.pesquisaProduto().toLowerCase().trim();
    if (!termo) return this.produtos;
    return this.produtos.filter((p) => p.nome.toLowerCase().includes(termo));
  });

  subtotal = computed(() =>
    this.itensCarrinho().reduce((acc, i) => acc + i.quantidade * i.preco_unitario, 0)
  );

  totalPagar = computed(() => this.subtotal());

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) {
    void this.carregarClientes();
    void this.carregarProdutos();
  }

  async carregarClientes() {
    try {
      const res = await firstValueFrom(this.http.get<any[]>(`${API_URL}/clientes`));
      this.clientes = Array.isArray(res) ? res.map((c) => ({ id: Number(c.id), nome: c.nome })) : [];
    } catch {
      this.clientes = [];
    }
  }

  async carregarProdutos() {
    try {
      const res = await firstValueFrom(this.http.get<any[]>(`${API_URL}/produtos`));
      this.produtos = Array.isArray(res)
        ? res.map((pr) => ({ id: String(pr.id_prod ?? pr.id), nome: pr.nome, preco: Number(pr.preco ?? 0) }))
        : [];
    } catch {
      this.produtos = [];
    }
  }

  onPesquisaFocus() {
    this.mostrarListaProdutos.set(true);
  }

  onPesquisaBlur() {
    setTimeout(() => this.mostrarListaProdutos.set(false), 200);
  }

  selecionarProduto(pr: ProdutoOption) {
    this.pesquisaProduto.set(pr.nome);
    this._produtoSelecionado = pr;
    this.mostrarListaProdutos.set(false);
  }

  private _produtoSelecionado: ProdutoOption | null = null;

  adicionarItem() {
    const pr = this._produtoSelecionado;
    if (!pr) {
      void MessageService.validationError('Selecione um produto da lista');
      return;
    }

    const qty = this.quantidadeAdd();
    if (!Number.isFinite(qty) || qty < 1) {
      void MessageService.validationError('Quantidade invalida');
      return;
    }

    const itens = [...this.itensCarrinho()];
    const existente = itens.find((i) => i.produtoId === pr.id);
    if (existente) {
      existente.quantidade += qty;
    } else {
      itens.push({ produtoId: pr.id, nome: pr.nome, quantidade: qty, preco_unitario: pr.preco });
    }
    this.itensCarrinho.set(itens);

    this.pesquisaProduto.set('');
    this.quantidadeAdd.set(1);
    this._produtoSelecionado = null;
  }

  removerItem(index: number) {
    const itens = [...this.itensCarrinho()];
    itens.splice(index, 1);
    this.itensCarrinho.set(itens);
  }

  selecionarFormaPagamento(forma: FormaPagamento) {
    this.formaPagamento.set(forma);
  }

  async confirmarPagamento() {
    if (this.itensCarrinho().length === 0) {
      void MessageService.validationError('Adicione ao menos um item');
      return;
    }

    const ok = await MessageService.confirmAction('Confirmar pagamento desta venda?', {
      title: 'Confirmar Pagamento',
      confirmButtonText: 'Confirmar',
      confirmButtonColor: '#22c55e',
    });
    if (!ok) return;

    await this.criarPedidoAPI('pago');
  }

  abrirModalPedido() {
    if (this.itensCarrinho().length === 0) {
      void MessageService.validationError('Adicione ao menos um item');
      return;
    }
    this.dataEntrega.set('');
    this.mostraModalPedido.set(true);
  }

  fecharModalPedido() {
    this.mostraModalPedido.set(false);
  }

  async salvarPedido() {
    if (!this.dataEntrega()) {
      void MessageService.validationError('Informe a data de entrega');
      return;
    }
    this.fecharModalPedido();
    await this.criarPedidoAPI('aberto');
  }

  private async criarPedidoAPI(status: string) {
    const user = this.auth.currentUser();
    const uid = user?.id?.trim();
    if (!uid) {
      void MessageService.validationError('Sessao invalida. Faca login novamente.');
      return;
    }

    const clienteId = this.clienteSelecionadoId() ? Number(this.clienteSelecionadoId()) : null;
    const itens = this.itensCarrinho();

    try {
      this.salvando.set(true);

      const body: any = {
        usuarioId: uid,
        total: 0,
        status,
        itens: [],
      };
      if (clienteId && Number.isFinite(clienteId) && clienteId > 0) {
        body.clienteId = clienteId;
      }
      const entrega = this.dataEntrega();
      if (entrega) {
        body.data_entrega = entrega;
      }

      const criado = await firstValueFrom(this.http.post<any>(`${API_URL}/pedidos`, body));
      const pedidoId = String(criado?.id ?? '');
      if (!pedidoId) throw new Error('Resposta invalida ao criar venda');

      for (const item of itens) {
        await firstValueFrom(
          this.http.post(`${API_URL}/itens-pedido`, {
            pedidoId,
            produtoId: item.produtoId.trim(),
            quantidade: item.quantidade,
            preco_unitario: item.preco_unitario,
          })
        );
      }

      await MessageService.success(status === 'pago' ? 'Venda confirmada com sucesso!' : 'Pedido adicionado com sucesso!');
      this.novaVenda();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      if (isHandledValidationError(error)) return;
      const message = MessageService.extractErrorMessage(error, 'Erro ao salvar venda');
      void MessageService.error(message);
    } finally {
      this.salvando.set(false);
    }
  }

  novaVenda() {
    this.itensCarrinho.set([]);
    this.clienteNome.set('');
    this.clienteCpfCnpj.set('');
    this.clienteSelecionadoId.set('');
    this.pesquisaProduto.set('');
    this.quantidadeAdd.set(1);
    this.formaPagamento.set('dinheiro');
    this._produtoSelecionado = null;
  }

  async cancelarVenda() {
    if (this.itensCarrinho().length === 0) {
      this.novaVenda();
      return;
    }

    const ok = await MessageService.confirmAction('Tem certeza que deseja cancelar esta venda?', {
      title: 'Cancelar Venda',
      confirmButtonText: 'Sim, cancelar',
      confirmButtonColor: '#dc2626',
    });
    if (ok) this.novaVenda();
  }
}
