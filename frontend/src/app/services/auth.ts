import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_URL, ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_STORAGE_KEY } from './constants';
import { PERFIL_PADRAO, type Perfil } from './profiles';
import { isHandledValidationError } from './http-error.utils';

export interface User {
  id?: string;
  nome: string;
  sobrenome?: string;
  email: string;
  funcao: Perfil;
  perfil?: Perfil;
}

interface LoginResponse {
  usuario: {
    id_user: string;
    nome: string;
    email: string;
    perfil: string;
  };
  accessToken: string;
  refreshToken: string;
}

interface GoogleLoginRequest {
  idToken: string;
}

interface RefreshResponse {
  usuario: {
    id_user: string;
    nome: string;
    email: string;
    perfil: string;
  };
  accessToken: string;
  refreshToken: string;
}

export interface AuthActionResult {
  success: boolean;
  message?: string;
  handledByInterceptor?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  currentUser = signal<User | null>(null);
  isLoggedIn = signal(false);

  constructor(private http: HttpClient) {
    this.restoreFromStorage();
  }

  private restoreFromStorage() {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return;
    }

    const userJson = localStorage.getItem(USER_STORAGE_KEY);
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

    if (userJson && accessToken && refreshToken) {
      try {
        const stored = JSON.parse(userJson) as User;
        this.currentUser.set(stored);
        this.isLoggedIn.set(true);
        return;
      } catch {
        this.clearSession();
      }
    }

    // Keeps user logged in after page reload when only refresh token is still valid.
    if (refreshToken) {
      void this.refreshAccessToken();
    }
  }

  private saveSession(user: User, accessToken: string, refreshToken: string) {
    this.currentUser.set(user);
    this.isLoggedIn.set(true);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }

  private clearSession() {
    this.currentUser.set(null);
    this.isLoggedIn.set(false);
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  private mapFuncaoToPerfil(funcao: unknown): Perfil {
    const numericMap: Record<number, Perfil> = {
      0: 'ADMINISTRADOR_SISTEMA',
      1: 'GERENTE_SUPERVISOR',
      2: 'OPERADOR_ESTOQUE',
      3: 'FINANCEIRO_CONTADOR',
      4: PERFIL_PADRAO,
    };
    if (typeof funcao === 'number' && Number.isFinite(funcao)) {
      return numericMap[funcao] ?? PERFIL_PADRAO;
    }
    const perfil = typeof funcao === 'string' ? funcao.trim().toUpperCase() : '';
    const aliasMap: Record<string, Perfil> = {
      ADMINISTRADOR: 'ADMINISTRADOR_SISTEMA',
      ADMINISTRADOR_SISTEMA: 'ADMINISTRADOR_SISTEMA',
      GERENTE: 'GERENTE_SUPERVISOR',
      SUPERVISOR: 'GERENTE_SUPERVISOR',
      GERENTE_SUPERVISOR: 'GERENTE_SUPERVISOR',
      OPERADOR_ESTOQUE: 'OPERADOR_ESTOQUE',
      ALMOXARIFE: 'OPERADOR_ESTOQUE',
      FINANCEIRO: 'FINANCEIRO_CONTADOR',
      CONTADOR: 'FINANCEIRO_CONTADOR',
      FINANCEIRO_CONTADOR: 'FINANCEIRO_CONTADOR',
      APENAS_VISUALIZACAO: PERFIL_PADRAO,
      VISUALIZACAO: PERFIL_PADRAO,
      LEITOR: PERFIL_PADRAO,
    };
    return aliasMap[perfil] ?? PERFIL_PADRAO;
  }

  private getErrorMessage(error: unknown) {
    if (error instanceof HttpErrorResponse) {
      if (typeof error.error === 'string' && error.error.trim().length > 0) {
        return error.error.trim();
      }

      if (error.error && typeof error.error.message === 'string' && error.error.message.trim().length > 0) {
        return error.error.message.trim();
      }

      if (error.error && typeof error.error.error === 'string' && error.error.error.trim().length > 0) {
        return error.error.error.trim();
      }

      if (error.status === 401) {
        return 'Credenciais inválidas';
      }
    }
    return 'Erro de comunicação com o servidor. Tente novamente.';
  }

  async login(email: string, password: string): Promise<AuthActionResult> {
    try {
      const response = await firstValueFrom(
        this.http.post<LoginResponse>(`${API_URL}/auth/login`, {
          email,
          senha: password,
        })
      );

      const user: User = {
        id: response.usuario.id_user,
        nome: response.usuario.nome,
        sobrenome: '',
        email: response.usuario.email,
        funcao: this.mapFuncaoToPerfil(response.usuario.perfil),
      };

      this.saveSession(user, response.accessToken, response.refreshToken);
      return { success: true };
    } catch (error) {
      if (isHandledValidationError(error)) {
        return { success: false, handledByInterceptor: true };
      }
      return { success: false, message: this.getErrorMessage(error) };
    }
  }

  async loginWithGoogle(idToken: string): Promise<AuthActionResult> {
    try {
      const response = await firstValueFrom(
        this.http.post<LoginResponse>(`${API_URL}/auth/google`, {
          idToken,
        } as GoogleLoginRequest)
      );

      const user: User = {
        id: response.usuario.id_user,
        nome: response.usuario.nome,
        sobrenome: '',
        email: response.usuario.email,
        funcao: this.mapFuncaoToPerfil(response.usuario.perfil),
      };

      this.saveSession(user, response.accessToken, response.refreshToken);
      return { success: true };
    } catch (error) {
      if (isHandledValidationError(error)) {
        return { success: false, handledByInterceptor: true };
      }
      return { success: false, message: this.getErrorMessage(error) };
    }
  }

  async register(user: User, password: string): Promise<AuthActionResult> {
    try {
      const perfil = this.mapFuncaoToPerfil(user.funcao);
      const fullName = `${user.nome} ${user.sobrenome || ''}`.trim();

      await firstValueFrom(
        this.http.post(`${API_URL}/usuarios`, {
          nome: fullName,
          email: user.email,
          password,
          perfil,
        })
      );

      return this.login(user.email, password);
    } catch (error) {
      if (isHandledValidationError(error)) {
        return { success: false, handledByInterceptor: true };
      }
      return { success: false, message: this.getErrorMessage(error) };
    }
  }

  async logout(): Promise<void> {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (refreshToken) {
      try {
        await firstValueFrom(this.http.post(`${API_URL}/auth/logout`, { refreshToken }));
      } catch {
      }
    }
    this.clearSession();
  }

  getCurrentUser(): User | null {
    return this.currentUser();
  }

  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  getPerfil(): string | null {
    const user = this.currentUser();
    return user?.funcao || null;
  }

  isAuthenticated(): boolean {
    return this.isLoggedIn();
  }

  async refreshAccessToken(): Promise<boolean> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      this.clearSession();
      return false;
    }

    try {
      const response = await firstValueFrom(
        this.http.post<RefreshResponse>(`${API_URL}/auth/refresh`, {
          refreshToken,
        })
      );

      localStorage.setItem(ACCESS_TOKEN_KEY, response.accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);

      const user: User = {
        id: response.usuario.id_user,
        nome: response.usuario.nome,
        sobrenome: '',
        email: response.usuario.email,
        funcao: this.mapFuncaoToPerfil(response.usuario.perfil),
      };
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      this.currentUser.set(user);
      this.isLoggedIn.set(true);

      return true;
    } catch (error) {
      this.clearSession();
      return false;
    }
  }
}
