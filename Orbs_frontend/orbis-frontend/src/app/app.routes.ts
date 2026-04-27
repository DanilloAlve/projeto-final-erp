import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { Cadastro } from './components/cadastro/cadastro';
import { Dashboard } from './components/dashboard/dashboard';
import { Financeiro } from './components/financeiro/financeiro';
import { Movimentacoes } from './components/movimentacoes/movimentacoes';
import { Clientes } from './components/clientes/clientes';
import { Pedidos } from './components/pedidos/pedidos';
import { Produtos } from './components/produtos/produtos';
import { UsuariosComponent } from './components/usuarios/usuarios';
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'cadastro', component: Cadastro },
  {
    path: 'dashboard',
    component: Dashboard,
    canActivate: [AuthGuard, RoleGuard],
  },
  {
    path: 'produtos',
    component: Produtos,
    canActivate: [AuthGuard, RoleGuard],
    data: { perfis: ['ADMINISTRADOR_SISTEMA', 'GERENTE_SUPERVISOR', 'OPERADOR_ESTOQUE'] },
  },
  {
    path: 'financeiro',
    component: Financeiro,
    canActivate: [AuthGuard, RoleGuard],
    data: { perfis: ['ADMINISTRADOR_SISTEMA', 'GERENTE_SUPERVISOR', 'FINANCEIRO_CONTADOR'] },
  },
  {
    path: 'movimentacoes',
    component: Movimentacoes,
    canActivate: [AuthGuard, RoleGuard],
    data: { perfis: ['ADMINISTRADOR_SISTEMA', 'GERENTE_SUPERVISOR', 'OPERADOR_ESTOQUE', 'FINANCEIRO_CONTADOR'] },
  },
  {
    path: 'clientes',
    component: Clientes,
    canActivate: [AuthGuard, RoleGuard],
    data: { perfis: ['ADMINISTRADOR_SISTEMA', 'GERENTE_SUPERVISOR', 'FINANCEIRO_CONTADOR'] },
  },
  {
    path: 'pedidos',
    component: Pedidos,
    canActivate: [AuthGuard, RoleGuard],
    data: { perfis: ['ADMINISTRADOR_SISTEMA', 'GERENTE_SUPERVISOR', 'FINANCEIRO_CONTADOR'] },
  },
  {
    path: 'usuarios',
    component: UsuariosComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { perfis: ['ADMINISTRADOR_SISTEMA', 'GERENTE_SUPERVISOR'] },
  },
  { path: '**', redirectTo: 'login' },
];
