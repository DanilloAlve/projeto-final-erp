import { AfterViewInit, Component, Inject, PLATFORM_ID, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../../services/auth';
import { GOOGLE_CLIENT_ID } from '../../services/constants';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
            ux_mode?: 'popup' | 'redirect';
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: 'standard' | 'icon';
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
              width?: string | number;
            }
          ) => void;
        };
      };
    };
  }
}

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements AfterViewInit {
  email = signal('');
  password = signal('');
  mostrarSenha = signal(false);
  rememberMe = signal(false);
  showError = signal(false);
  errorMessage = signal('');

  constructor(
    private authService: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: object
  ) {
    if (this.authService.isAuthenticated()) {
      void this.router.navigate(['/dashboard']);
    }
  }

  ngAfterViewInit(): void {
    this.initializeGoogleLogin();
  }

  private initializeGoogleLogin() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (!GOOGLE_CLIENT_ID) {
      return;
    }

    let attempts = 0;
    const maxAttempts = 20;

    const tryRender = () => {
      const googleApi = window.google?.accounts?.id;
      const target = document.getElementById('google-login-button');
      if (!googleApi || !target) {
        attempts += 1;
        if (attempts < maxAttempts) {
          setTimeout(tryRender, 200);
        }
        return;
      }

      googleApi.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => {
          if (response.credential) {
            void this.loginWithGoogle(response.credential);
          }
        },
        ux_mode: 'popup',
      });

      target.innerHTML = '';
      googleApi.renderButton(target, {
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        width: 320,
      });
    };

    tryRender();
  }

  private async loginWithGoogle(idToken: string) {
    this.showError.set(false);
    const result = await this.authService.loginWithGoogle(idToken);
    if (result.success) {
      await this.router.navigate(['/dashboard']);
      return;
    }

    this.errorMessage.set(result.message ?? 'Falha ao entrar com Google');
    this.showError.set(true);
  }

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
      if (result.handledByInterceptor) {
        this.password.set('');
        return;
      }
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
