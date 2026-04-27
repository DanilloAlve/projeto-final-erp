import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { UsuarioService, Usuario, CreateUsuarioDTO, UpdateUsuarioDTO } from '../../services/usuario.service';
import { PERFIS, type Perfil } from '../../services/profiles';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.html',
  styleUrls: ['./usuarios.css'],
})
export class UsuariosComponent implements OnInit, OnDestroy {
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

  podeVerPedidos() {
    const p = this.perfilAtual();
    return p === 'ADMINISTRADOR_SISTEMA' || p === 'GERENTE_SUPERVISOR' || p === 'FINANCEIRO_CONTADOR';
  }

  usuarios: Usuario[] = [];
  usuariosFiltrados: Usuario[] = [];
  carregando = false;
  mostraModal = false;
  mostraConfirmacao = false;
  usuarioEmExclusao: string | null = null;

  filtros = {
    perfil: '',
    ativo: '',
    busca: '',
  };

  perfisDisponiveis: Perfil[] = [];

  formulario = {
    id: '',
    nome: '',
    email: '',
    password: '',
    perfil: 'APENAS_VISUALIZACAO' as Perfil,
    isEdicao: false,
  };

  errosFormulario = {
    nome: '',
    email: '',
    password: '',
  };

  constructor(
    private authService: AuthService,
    private usuarioService: UsuarioService,
    private router: Router
  ) {
    this.currentUser.set(this.authService.getCurrentUser());
    if (!this.currentUser()) {
      this.router.navigate(['/login']);
    }

    this.perfisDisponiveis = this.getPerfisPermitidosParaCadastro(this.currentUser()?.funcao ?? null);
  }

  private getPerfisPermitidosParaCadastro(perfilAtual: Perfil | null): Perfil[] {
    if (!perfilAtual) {
      return ['APENAS_VISUALIZACAO'];
    }

    if (perfilAtual === 'ADMINISTRADOR_SISTEMA') {
      return PERFIS.filter((p) => p !== 'ADMINISTRADOR_SISTEMA');
    }

    if (perfilAtual === 'GERENTE_SUPERVISOR') {
      return ['OPERADOR_ESTOQUE', 'FINANCEIRO_CONTADOR', 'APENAS_VISUALIZACAO'];
    }

    return ['APENAS_VISUALIZACAO'];
  }

  async ngOnInit() {
    await this.carregarUsuarios();
  }

  ngOnDestroy() {
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

  irParaPedidos() {
    this.router.navigate(['/pedidos']);
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

  async carregarUsuarios() {
    try {
      this.carregando = true;
      this.usuarios = await this.usuarioService.listar();
      this.aplicarFiltros();
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      alert('Erro ao carregar usuários');
    } finally {
      this.carregando = false;
    }
  }

  aplicarFiltros() {
    let filtrados = [...this.usuarios];

    if (this.filtros.perfil) {
      filtrados = filtrados.filter((u) => (u.perfil ?? '') === this.filtros.perfil);
    }

    if (this.filtros.ativo) {
      const ativo = this.filtros.ativo === 'true';
      filtrados = filtrados.filter((u) => u.ativo === ativo);
    }

    if (this.filtros.busca) {
      const termo = this.filtros.busca.toLowerCase();
      filtrados = filtrados.filter(
        (u) =>
          u.nome.toLowerCase().includes(termo) ||
          u.email.toLowerCase().includes(termo)
      );
    }

    this.usuariosFiltrados = filtrados;
  }

  abrirModal(usuario?: Usuario) {
    if (usuario) {
      this.formulario = {
        id: usuario.id_user,
        nome: usuario.nome,
        email: usuario.email,
        password: '',
        perfil: (usuario.perfil ?? 'APENAS_VISUALIZACAO') as Perfil,
        isEdicao: true,
      };
    } else {
      this.formulario = {
        id: '',
        nome: '',
        email: '',
        password: '',
        perfil: 'APENAS_VISUALIZACAO' as Perfil,
        isEdicao: false,
      };
    }
    this.validarFormulario();
    this.mostraModal = true;
  }

  fecharModal() {
    this.mostraModal = false;
    this.formulario = {
      id: '',
      nome: '',
      email: '',
      password: '',
      perfil: 'APENAS_VISUALIZACAO' as Perfil,
      isEdicao: false,
    };
    this.errosFormulario = {
      nome: '',
      email: '',
      password: '',
    };
  }

  private isNomeValido(nome: string) {
    return nome.trim().length > 0;
  }

  private isEmailValido(email: string) {
    const value = email.trim();
    if (!value) return false;
    return /^[^\s@]+@[^\s@]+\.com$/i.test(value);
  }

  private isSenhaValida(senha: string) {
    const value = senha ?? '';
    if (value.length < 6) return false;
    const temMaiuscula = /[A-Z]/.test(value);
    const temMinuscula = /[a-z]/.test(value);
    const temEspecial = /[^A-Za-z0-9]/.test(value);
    return temMaiuscula && temMinuscula && temEspecial;
  }

  validarFormulario() {
    const nomeOk = this.isNomeValido(this.formulario.nome);
    const emailOk = this.isEmailValido(this.formulario.email);
    const senhaOk = this.formulario.isEdicao ? true : this.isSenhaValida(this.formulario.password);

    this.errosFormulario.nome = nomeOk ? '' : 'Nome é obrigatório.';
    this.errosFormulario.email = emailOk ? '' : 'Email inválido.';
    this.errosFormulario.password = senhaOk
      ? ''
      : 'Senha deve ter no mínimo 6 caracteres e conter: 1 letra maiúscula, 1 letra minúscula e 1 caractere especial.';
  }

  formularioValido() {
    this.validarFormulario();
    return !this.errosFormulario.nome && !this.errosFormulario.email && !this.errosFormulario.password;
  }

  async salvarUsuario() {
    try {
      if (!this.formularioValido() || !this.formulario.perfil) {
        alert('Verifique os campos do formulário.');
        return;
      }

      if (this.formulario.isEdicao) {
        const dados: UpdateUsuarioDTO = {
          nome: this.formulario.nome,
          email: this.formulario.email,
          perfil: this.formulario.perfil,
        };
        await this.usuarioService.editar(this.formulario.id, dados);
        alert('Usuário atualizado com sucesso');
      } else {
        const dados: CreateUsuarioDTO = {
          nome: this.formulario.nome,
          email: this.formulario.email,
          password: this.formulario.password,
          perfil: this.formulario.perfil,
        };
        await this.usuarioService.criar(dados);
        alert('Usuário criado com sucesso');
      }

      this.fecharModal();
      await this.carregarUsuarios();
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      if (error instanceof HttpErrorResponse) {
        const message = (error.error && (error.error.message || error.error.error)) || error.message;
        alert(message || 'Erro ao salvar usuário');
        return;
      }
      alert('Erro ao salvar usuário');
    }
  }

  abrirConfirmacaoExclusao(usuarioId: string) {
    this.usuarioEmExclusao = usuarioId;
    this.mostraConfirmacao = true;
  }

  fecharConfirmacao() {
    this.mostraConfirmacao = false;
    this.usuarioEmExclusao = null;
  }

  async confirmarExclusao() {
    if (!this.usuarioEmExclusao) return;

    try {
      await this.usuarioService.excluir(this.usuarioEmExclusao);
      alert('Usuário excluído com sucesso');
      this.fecharConfirmacao();
      await this.carregarUsuarios();
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      alert('Erro ao excluir usuário');
    }
  }

  async alternarStatus(usuario: Usuario) {
    alert('Alteração de status não está disponível nesta versão da API.');
  }

  limparFiltros() {
    this.filtros = {
      perfil: '',
      ativo: '',
      busca: '',
    };
    this.aplicarFiltros();
  }
}
