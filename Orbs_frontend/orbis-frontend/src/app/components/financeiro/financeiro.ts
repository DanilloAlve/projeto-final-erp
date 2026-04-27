import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../services/auth';
import { API_URL } from '../../services/constants';

type ProdutoResumo = {
  id: string;
  nome: string;
  preco: number;
  estoque_atual: number;
};

type LinhaFinanceiro = {
  id: string;
  nome: string;
  valorUnitario: number;
  quantidade: number;
  valorTotal: number;
};

@Component({
  selector: 'app-financeiro',
  imports: [CommonModule],
  templateUrl: './financeiro.html',
  styleUrl: './financeiro.css',
})
export class Financeiro {
  currentUser = signal<any>(null);
  menuAberto = signal(false);
  menuRecolhido = signal(false);

  loading = signal(false);
  errorMessage = signal('');

  produtos = signal<ProdutoResumo[]>([]);

  private perfilAtual() {
    return this.currentUser()?.funcao ?? null;
  }

  podeVerProdutos() {
    const p = this.perfilAtual();
    return p === 'ADMINISTRADOR_SISTEMA' || p === 'GERENTE_SUPERVISOR' || p === 'OPERADOR_ESTOQUE';
  }

  podeVerMovimentacoes() {
    const p = this.perfilAtual();
    return (
      p === 'ADMINISTRADOR_SISTEMA' ||
      p === 'GERENTE_SUPERVISOR' ||
      p === 'OPERADOR_ESTOQUE' ||
      p === 'FINANCEIRO_CONTADOR'
    );
  }

  podeVerClientes() {
    const p = this.perfilAtual();
    return p === 'ADMINISTRADOR_SISTEMA' || p === 'GERENTE_SUPERVISOR' || p === 'FINANCEIRO_CONTADOR';
  }

  podeVerPedidos() {
    const p = this.perfilAtual();
    return p === 'ADMINISTRADOR_SISTEMA' || p === 'GERENTE_SUPERVISOR' || p === 'FINANCEIRO_CONTADOR';
  }

  podeVerUsuarios() {
    const p = this.perfilAtual();
    return p === 'ADMINISTRADOR_SISTEMA' || p === 'GERENTE_SUPERVISOR';
  }

  constructor(private authService: AuthService, private http: HttpClient, private router: Router) {
    this.currentUser.set(this.authService.getCurrentUser());
    if (!this.currentUser()) {
      this.router.navigate(['/login']);
      return;
    }

    this.carregarProdutos();
  }

  private mapApiProduto(p: any): ProdutoResumo {
    return {
      id: p.id_prod ?? p.id,
      nome: p.nome,
      preco: Number(p.preco ?? 0),
      estoque_atual: Number(p.estoque_atual ?? 0),
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
      console.error('Erro ao carregar produtos (financeiro):', error);
      this.errorMessage.set('Erro ao carregar produtos');
    } finally {
      this.loading.set(false);
    }
  }

  private formatBRL(value: number) {
    const v = Number(value ?? 0);
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  }

  get linhasFinanceiro(): LinhaFinanceiro[] {
    return this.produtos().map((p) => {
      const quantidade = Number(p.estoque_atual ?? 0);
      const valorUnitario = Number(p.preco ?? 0);
      return {
        id: p.id,
        nome: p.nome,
        valorUnitario,
        quantidade,
        valorTotal: valorUnitario * quantidade,
      };
    });
  }

  get totalGeral(): number {
    return this.linhasFinanceiro.reduce((acc, l) => acc + l.valorTotal, 0);
  }

  formatValorUnitario(v: number) {
    return this.formatBRL(v);
  }

  formatValorTotal(v: number) {
    return this.formatBRL(v);
  }

  irParaDashboard() {
    this.router.navigate(['/dashboard']);
  }

  irParaProdutos() {
    this.router.navigate(['/produtos']);
  }

  irParaMovimentacoes() {
    this.router.navigate(['/movimentacoes']);
  }

  irParaClientes() {
    this.router.navigate(['/clientes']);
  }

  irParaPedidos() {
    this.router.navigate(['/pedidos']);
  }

  irParaUsuarios() {
    this.router.navigate(['/usuarios']);
  }

  async logout() {
    await this.authService.logout();
    this.router.navigate(['/login']);
  }

  toggleMenu() {
    this.menuAberto.set(!this.menuAberto());
  }

  toggleMenuRecolhido() {
    this.menuRecolhido.set(!this.menuRecolhido());
  }
}
