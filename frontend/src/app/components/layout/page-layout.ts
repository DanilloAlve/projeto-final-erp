import { CommonModule } from '@angular/common';
import { Component, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { PerfilEnum, type Perfil } from '../../services/profiles';

type PageKey = 'dashboard' | 'produtos' | 'categorias' | 'financeiro' | 'movimentacoes' | 'clientes' | 'pedidos' | 'usuarios';

@Component({
  selector: 'app-page-layout',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './page-layout.html',
  styleUrl: './page-layout.css',
})
export class PageLayoutComponent {
  currentPage = input.required<PageKey>();

  currentUser = signal<any>(null);
  menuAberto = signal(false);
  menuRecolhido = signal(false);
  menuUsuarioAberto = signal(false);

  constructor(private authService: AuthService, private router: Router) {
    this.currentUser.set(this.authService.getCurrentUser());
    if (!this.currentUser()) {
      this.router.navigate(['/login']);
    }
  }

  private perfilAtual(): Perfil | null {
    return this.currentUser()?.funcao ?? null;
  }

  /** Retorna true se o usuário tiver um dos perfis informados. */
  private perfilEhUmDe(...perfis: PerfilEnum[]): boolean {
    const p = this.perfilAtual();
    if (p === null) return false;
    return perfis.some((candidato) => candidato === p);
  }

  isPaginaAtiva(page: PageKey) {
    return this.currentPage() === page;
  }

  podeVerProdutos() {
    return this.perfilEhUmDe(
      PerfilEnum.ADMINISTRADOR_SISTEMA,
      PerfilEnum.GERENTE_SUPERVISOR,
      PerfilEnum.OPERADOR_ESTOQUE
    );
  }

  podeVerCategorias() {
    return this.perfilEhUmDe(
      PerfilEnum.ADMINISTRADOR_SISTEMA,
      PerfilEnum.GERENTE_SUPERVISOR,
      PerfilEnum.OPERADOR_ESTOQUE
    );
  }

  podeVerFinanceiro() {
    return this.perfilEhUmDe(
      PerfilEnum.ADMINISTRADOR_SISTEMA,
      PerfilEnum.GERENTE_SUPERVISOR,
      PerfilEnum.FINANCEIRO_CONTADOR
    );
  }

  podeVerMovimentacoes() {
    return this.perfilEhUmDe(
      PerfilEnum.ADMINISTRADOR_SISTEMA,
      PerfilEnum.GERENTE_SUPERVISOR,
      PerfilEnum.OPERADOR_ESTOQUE,
      PerfilEnum.FINANCEIRO_CONTADOR
    );
  }

  podeVerClientes() {
    return this.perfilEhUmDe(
      PerfilEnum.ADMINISTRADOR_SISTEMA,
      PerfilEnum.GERENTE_SUPERVISOR,
      PerfilEnum.FINANCEIRO_CONTADOR
    );
  }

  podeVerPedidos() {
    return this.perfilEhUmDe(
      PerfilEnum.ADMINISTRADOR_SISTEMA,
      PerfilEnum.GERENTE_SUPERVISOR,
      PerfilEnum.FINANCEIRO_CONTADOR,
      PerfilEnum.OPERADOR_ESTOQUE
    );
  }

  podeVerUsuarios() {
    return this.perfilEhUmDe(PerfilEnum.ADMINISTRADOR_SISTEMA);
  }

  irParaDashboard() {
    this.router.navigate(['/dashboard']);
  }

  irParaProdutos() {
    this.router.navigate(['/produtos']);
  }

  irParaCategorias() {
    this.router.navigate(['/categorias']);
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

  toggleMenuRecolhido() {
    this.menuRecolhido.set(!this.menuRecolhido());
  }

  toggleMenuUsuario() {
    this.menuUsuarioAberto.set(!this.menuUsuarioAberto());
  }

  getNomeUsuario() {
    return this.currentUser()?.nome || 'Usuário';
  }

  getPerfilUsuario() {
    const perfil = this.currentUser()?.funcao;
    if (!perfil) {
      return 'Sem perfil';
    }

    return perfil
      .toLowerCase()
      .split('_')
      .map((parte: string) => parte.charAt(0).toUpperCase() + parte.slice(1))
      .join(' ');
  }
}
