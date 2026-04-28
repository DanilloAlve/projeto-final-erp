import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { PERFIS, PERFIL_PADRAO, type Perfil } from '../../services/profiles';

@Component({
  selector: 'app-cadastro',
  imports: [CommonModule, FormsModule],
  templateUrl: './cadastro.html',
  styleUrl: './cadastro.css',
})
export class Cadastro {
  nome = signal('');
  email = signal('');
  perfil = signal<Perfil>(PERFIL_PADRAO);
  senha = signal('');
  confirmacaoSenha = signal('');
  termosSenha = signal(false);
  showError = signal(false);
  errorMessage = signal('');
  senhaVisivel = signal(false);
  confirmacaoVisivel = signal(false);

  perfis = [...PERFIS];

  constructor(private authService: AuthService, private router: Router) {}

  validarSenha(senha: string): boolean {
    return (
      senha.length >= 8 &&
      /[A-Z]/.test(senha) &&
      /[a-z]/.test(senha) &&
      /[0-9]/.test(senha) &&
      /[^A-Za-z0-9]/.test(senha)
    );
  }

  getSenhaRequisitos() {
    return {
      tamanho: this.senha().length >= 8,
      maiuscula: /[A-Z]/.test(this.senha()),
      minuscula: /[a-z]/.test(this.senha()),
      numero: /[0-9]/.test(this.senha()),
      especial: /[^A-Za-z0-9]/.test(this.senha()),
    };
  }

  async criarConta() {
    this.showError.set(false);

    if (!this.nome() || !this.email() || !this.perfil() || !this.senha()) {
      this.errorMessage.set('Por favor, preencha todos os campos');
      this.showError.set(true);
      return;
    }

    if (!this.validarSenha(this.senha())) {
      this.errorMessage.set('A senha não atende aos requisitos mínimos');
      this.showError.set(true);
      return;
    }

    if (this.senha() !== this.confirmacaoSenha()) {
      this.errorMessage.set('As senhas não correspondem');
      this.showError.set(true);
      return;
    }

    if (!this.termosSenha()) {
      this.errorMessage.set('Você deve aceitar os Termos de Serviço e Política de Privacidade');
      this.showError.set(true);
      return;
    }

    const user = {
      nome: this.nome(),
      sobrenome: '',
      email: this.email(),
      funcao: this.perfil(),
    };

    const result = await this.authService.register(user, this.senha());

    if (result.success) {
      this.router.navigate(['/dashboard']);
    } else {
      if (result.handledByInterceptor) {
        return;
      }
      this.errorMessage.set(result.message ?? 'Erro ao criar conta. Tente novamente.');
      this.showError.set(true);
    }
  }

  voltarLogin() {
    this.router.navigate(['/login']);
  }
}
