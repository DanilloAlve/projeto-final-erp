import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UsuarioService, Usuario, CreateUsuarioDTO, UpdateUsuarioDTO } from '../../services/usuario.service';
import {
  PERFIS,
  PERFIL_LABELS,
  PERFIL_PADRAO,
  perfilChaveOuVazio,
  perfilEstaDefinido,
  perfilFromApi,
  perfilToKeyOrDefault,
  type Perfil,
} from '../../services/profiles';
import { AuthService } from '../../services/auth';
import { isHandledValidationError } from '../../services/http-error.utils';
import { MessageService } from '../../services/message.service';
import { PageLayoutComponent } from '../layout/page-layout';

type UsuarioForm = {
  id: string;
  nome: string;
  email: string;
  password: string;
  confirmacaoSenha: string;
  termosSenha: boolean;
  perfil: Perfil;
  isEdicao: boolean;
};

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule, PageLayoutComponent],
  templateUrl: './usuarios.html',
  styleUrls: ['./usuarios.css'],
})
export class UsuariosComponent implements OnInit {
  currentUser = signal<any>(null);

  usuarios: Usuario[] = [];
  usuariosFiltrados: Usuario[] = [];
  loading = signal(false);
  salvando = signal(false);
  excluindo = signal(false);
  errorMessage = signal('');
  mostraModal = signal(false);
  modalLiberado = signal(false);
  cliqueNovoUsuarioArmado = false;

  /** Mesma lista de perfis da tela Criar Conta (cadastro). */
  /** Opções de perfil: sempre o array canônico `PERFIS` de `profiles.ts`. */
  readonly perfisCadastro: Perfil[] = [...PERFIS];
  readonly perfilLabels = PERFIL_LABELS;

  senhaVisivel = signal(false);
  confirmacaoVisivel = signal(false);

  filtros = {
    perfil: '',
    ativo: '',
    busca: '',
  };

  formulario = signal<UsuarioForm>({
    id: '',
    nome: '',
    email: '',
    password: '',
    confirmacaoSenha: '',
    termosSenha: false,
    perfil: PERFIL_PADRAO,
    isEdicao: false,
  });

  errosFormulario = signal({
    nome: '',
    email: '',
    password: '',
    confirmacaoSenha: '',
    termos: '',
  });

  constructor(
    private authService: AuthService,
    private usuarioService: UsuarioService,
    private router: Router
  ) {
    this.currentUser.set(this.authService.getCurrentUser());
    if (!this.currentUser()) {
      this.router.navigate(['/login']);
    }
  }

  labelPerfil(p: Perfil): string {
    return this.perfilLabels[p] ?? p;
  }

  /** Rótulo amigável; normalização via `perfilFromApi` (`profiles.ts`). */
  exibirPerfilUsuario(perfil: unknown): string {
    const key = perfilFromApi(perfil);
    return key ? this.perfilLabels[key] : '';
  }

  classeBadgePerfil(perfil: unknown): string {
    const key = perfilFromApi(perfil);
    return key ? `badge-${key.toLowerCase()}` : '';
  }

  getSenhaRequisitos() {
    const s = this.formulario().password;
    return {
      tamanho: s.length >= 8,
      maiuscula: /[A-Z]/.test(s),
      minuscula: /[a-z]/.test(s),
      numero: /[0-9]/.test(s),
      especial: /[^A-Za-z0-9]/.test(s),
    };
  }

  private validarSenhaComoCadastro(senha: string): boolean {
    return (
      senha.length >= 8 &&
      /[A-Z]/.test(senha) &&
      /[a-z]/.test(senha) &&
      /[0-9]/.test(senha) &&
      /[^A-Za-z0-9]/.test(senha)
    );
  }

  async ngOnInit() {
    await this.carregarUsuarios();
    // Evita clique "vazando" da navegação lateral para o botão de novo usuário.
    setTimeout(() => this.modalLiberado.set(true), 0);
  }

  async carregarUsuarios() {
    try {
      this.loading.set(true);
      this.errorMessage.set('');
      this.usuarios = await this.usuarioService.listar();
      this.aplicarFiltros();
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      if (isHandledValidationError(error)) return;
      this.errorMessage.set('Erro ao carregar usuários');
    } finally {
      this.loading.set(false);
    }
  }

  aplicarFiltros() {
    let filtrados = [...this.usuarios];

    if (this.filtros.perfil) {
      filtrados = filtrados.filter((u) => perfilChaveOuVazio(u.perfil) === this.filtros.perfil);
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

  prepararAberturaNovoUsuario() {
    this.cliqueNovoUsuarioArmado = true;
    setTimeout(() => {
      this.cliqueNovoUsuarioArmado = false;
    }, 400);
  }

  abrirNovoUsuario(event?: MouseEvent) {
    if (!this.modalLiberado() || !this.cliqueNovoUsuarioArmado) {
      event?.preventDefault();
      return;
    }
    this.cliqueNovoUsuarioArmado = false;

    this.formulario.set({
      id: '',
      nome: '',
      email: '',
      password: '',
      confirmacaoSenha: '',
      termosSenha: false,
      perfil: PERFIL_PADRAO,
      isEdicao: false,
    });
    this.senhaVisivel.set(false);
    this.confirmacaoVisivel.set(false);
    this.validarFormulario();
    this.mostraModal.set(true);
  }

  abrirEdicaoUsuario(usuario: Usuario) {
    this.formulario.set({
      id: usuario.id_user,
      nome: usuario.nome,
      email: usuario.email,
      password: '',
      confirmacaoSenha: '',
      termosSenha: false,
      perfil: perfilToKeyOrDefault(usuario.perfil),
      isEdicao: true,
    });
    this.senhaVisivel.set(false);
    this.confirmacaoVisivel.set(false);
    this.validarFormulario();
    this.mostraModal.set(true);
  }

  fecharModal() {
    this.mostraModal.set(false);
    this.senhaVisivel.set(false);
    this.confirmacaoVisivel.set(false);
    this.formulario.set({
      id: '',
      nome: '',
      email: '',
      password: '',
      confirmacaoSenha: '',
      termosSenha: false,
      perfil: PERFIL_PADRAO,
      isEdicao: false,
    });
    this.errosFormulario.set({
      nome: '',
      email: '',
      password: '',
      confirmacaoSenha: '',
      termos: '',
    });
  }

  private isNomeValido(nome: string) {
    return nome.trim().length > 0;
  }

  private isEmailValido(email: string) {
    const value = email.trim();
    if (!value) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  validarFormulario() {
    const form = this.formulario();
    const nomeOk = this.isNomeValido(form.nome);
    const emailOk = this.isEmailValido(form.email);

    let passwordErr = '';
    let confirmacaoErr = '';
    let termosErr = '';

    if (!form.isEdicao) {
      passwordErr = this.validarSenhaComoCadastro(form.password)
        ? ''
        : 'A senha não atende aos requisitos mínimos.';
      if (form.password !== form.confirmacaoSenha) {
        confirmacaoErr = 'As senhas não correspondem.';
      }
      if (!form.termosSenha) {
        termosErr = 'Aceite os Termos de Serviço e a Política de Privacidade.';
      }
    }

    this.errosFormulario.set({
      nome: nomeOk ? '' : 'Nome é obrigatório.',
      email: emailOk ? '' : 'Email inválido.',
      password: passwordErr,
      confirmacaoSenha: confirmacaoErr,
      termos: termosErr,
    });
  }

  formularioValido() {
    this.validarFormulario();
    const erros = this.errosFormulario();
    const baseOk = !erros.nome && !erros.email;
    const form = this.formulario();
    if (form.isEdicao) {
      return baseOk && perfilEstaDefinido(form.perfil);
    }
    return (
      baseOk &&
      perfilEstaDefinido(form.perfil) &&
      !erros.password &&
      !erros.confirmacaoSenha &&
      !erros.termos
    );
  }

  atualizarCampo<K extends keyof UsuarioForm>(campo: K, valor: UsuarioForm[K]) {
    const atual = this.formulario();
    this.formulario.set({ ...atual, [campo]: valor });
  }

  onPerfilChange(val: string) {
    this.atualizarCampo('perfil', val as Perfil);
    this.validarFormulario();
  }

  async salvarUsuario() {
    const form = this.formulario();
    try {
      if (!this.formularioValido() || !perfilEstaDefinido(form.perfil)) {
        await MessageService.validationError('Verifique os campos do formulário.');
        return;
      }

      const perfilSalvar = perfilToKeyOrDefault(form.perfil);

      if (!form.isEdicao && form.password !== form.confirmacaoSenha) {
        await MessageService.validationError('As senhas não correspondem.');
        return;
      }

      if (!form.isEdicao && !form.termosSenha) {
        await MessageService.validationError(
          'Você deve aceitar os Termos de Serviço e Política de Privacidade.'
        );
        return;
      }

      this.salvando.set(true);

      if (form.isEdicao) {
        const dados: UpdateUsuarioDTO = {
          nome: form.nome,
          email: form.email,
          perfil: perfilSalvar,
        };
        await this.usuarioService.editar(form.id, dados);
        await MessageService.success('Usuário atualizado com sucesso');
      } else {
        const dados: CreateUsuarioDTO = {
          nome: form.nome,
          email: form.email,
          password: form.password,
          perfil: perfilSalvar,
        };
        await this.usuarioService.criar(dados);
        await MessageService.success('Usuário criado com sucesso');
      }

      this.fecharModal();
      await this.carregarUsuarios();
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      if (isHandledValidationError(error)) return;
      const message = MessageService.extractErrorMessage(error, 'Erro ao salvar usuário');
      void MessageService.error(message);
    } finally {
      this.salvando.set(false);
    }
  }

  async excluirUsuario(usuarioId: string) {
    const ok = await MessageService.confirmDelete('Tem certeza que deseja excluir este usuário?');
    if (!ok) return;

    try {
      this.excluindo.set(true);
      await this.usuarioService.excluir(usuarioId);
      await MessageService.success('Usuário excluído com sucesso');
      await this.carregarUsuarios();
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      if (isHandledValidationError(error)) return;
      const message = MessageService.extractErrorMessage(error, 'Erro ao excluir usuário');
      void MessageService.error(message);
    } finally {
      this.excluindo.set(false);
    }
  }

  async alternarStatus(usuario: Usuario) {
    void usuario;
    await MessageService.validationError('Alteração de status não está disponível nesta versão da API.');
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
