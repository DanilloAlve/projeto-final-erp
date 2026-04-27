import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth';
import type { Perfil } from '../services/profiles';

@Injectable({
  providedIn: 'root',
})
export class RoleGuard implements CanActivate {
  private rotaPorPerfil: Record<Perfil, string> = {
    ADMINISTRADOR_SISTEMA: '/usuarios',
    GERENTE_SUPERVISOR: '/usuarios',
    OPERADOR_ESTOQUE: '/produtos',
    FINANCEIRO_CONTADOR: '/financeiro',
    APENAS_VISUALIZACAO: '/dashboard',
  };

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const user = this.authService.getCurrentUser();

    if (!user) {
      this.router.navigate(['/login']);
      return false;
    }

    if (route.data['perfis']) {
      const perfilsRequeridos = Array.isArray(route.data['perfis'])
        ? route.data['perfis']
        : [route.data['perfis']];

      if (perfilsRequeridos.includes(user.funcao)) {
        return true;
      }

      const rotaPadrao = this.getRotaPadraoParaPerfil(user.funcao);
      this.router.navigate([rotaPadrao]);
      return false;
    }

    return true;
  }

  getRotaPadraoParaPerfil(perfil: Perfil): string {
    return this.rotaPorPerfil[perfil] || '/dashboard';
  }
}
