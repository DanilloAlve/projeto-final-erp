import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  email = signal('');
  password = signal('');
  mostrarSenha = signal(false);
  rememberMe = signal(false);
  showError = signal(false);
  errorMessage = signal('');

  constructor(private authService: AuthService, private router: Router) {}

  async login() {
    this.showError.set(false);

    if (!this.email() || !this.password()) {
      this.errorMessage.set('Por favor, preencha todos os campos');
      this.showError.set(true);
      return;
    }

    const result = await this.authService.login(this.email(), this.password());

    if (result.success) {
      this.router.navigate(['/dashboard']);
    } else {
      this.errorMessage.set(result.message ?? 'E-mail ou senha inválidos');
      this.showError.set(true);
      this.password.set('');
    }
  }

  goToRegister() {
    this.router.navigate(['/cadastro']);
  }

  forgotPassword() {
    alert('Redefinição de senha será implementada em breve');
  }

  toggleMostrarSenha() {
    this.mostrarSenha.set(!this.mostrarSenha());
  }
}
