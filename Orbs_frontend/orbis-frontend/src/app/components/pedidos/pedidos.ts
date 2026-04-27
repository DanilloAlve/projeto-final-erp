import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-pedidos',
  imports: [CommonModule],
  templateUrl: './pedidos.html',
  styleUrl: './pedidos.css',
})
export class Pedidos {
  currentUser = signal<any>(null);
  menuAberto = signal(false);
  menuRecolhido = signal(false);

  private perfilAtual() {
    return this.currentUser()?.funcao ?? null;
  }

  podeVerProdutos() {
    const p = this.perfilAtual();
    return p === 'ADMINISTRADOR_SISTEMA' || p === 'GERENTE_SUPERVISOR' || p === 'OPERADOR_ESTOQUE';
  }

  podeVerFinanceiro() {
    const p = this.perfilAtual();
    return p === 'ADMINISTRADOR_SISTEMA' || p === 'GERENTE_SUPERVISOR' || p === 'FINANCEIRO_CONTADOR';
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

  podeVerUsuarios() {
    const p = this.perfilAtual();
    return p === 'ADMINISTRADOR_SISTEMA' || p === 'GERENTE_SUPERVISOR';
  }

  constructor(private authService: AuthService, private router: Router) {
    this.currentUser.set(this.authService.getCurrentUser());
    if (!this.currentUser()) {
      this.router.navigate(['/login']);
    }
  }

  irParaDashboard() {
    this.router.navigate(['/dashboard']);
  }

  irParaProdutos() {
    this.router.navigate(['/produtos']);
  }

  irParaFinanceiro() {
    this.router.navigate(['/financeiro']);
  }

  irParaMovimentacoes() {
    this.router.navigate(['/movimentacoes']);
  }

  irParaClientes() {
    this.router.navigate(['/clientes']);
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
