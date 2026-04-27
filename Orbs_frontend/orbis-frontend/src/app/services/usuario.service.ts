import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_URL } from './constants';
import type { Perfil } from './profiles';

export interface Usuario {
  id_user: string;
  nome: string;
  email: string;
  perfil?: Perfil;
  ativo: boolean;
  criadoEm?: string;
  created_at?: string;
}

export interface CreateUsuarioDTO {
  nome: string;
  email: string;
  password: string;
  perfil: Perfil;
}

export interface UpdateUsuarioDTO {
  nome?: string;
  email?: string;
  perfil?: Perfil;
}

@Injectable({
  providedIn: 'root',
})
export class UsuarioService {
  private apiUrl = `${API_URL}/usuarios`;

  constructor(private http: HttpClient) {}

  private normalizeUsuario(usuario: Usuario): Usuario {
    const criadoEm = usuario.criadoEm ?? usuario.created_at;
    return { ...usuario, criadoEm };
  }

  async listar(): Promise<Usuario[]> {
    const usuarios = await firstValueFrom(this.http.get<Usuario[]>(this.apiUrl));
    return usuarios.map((u) => this.normalizeUsuario(u));
  }

  async buscarPorId(id: string): Promise<Usuario> {
    const usuario = await firstValueFrom(this.http.get<Usuario>(`${this.apiUrl}/${id}`));
    return this.normalizeUsuario(usuario);
  }

  async criar(dados: CreateUsuarioDTO): Promise<Usuario> {
    return await firstValueFrom(this.http.post<Usuario>(this.apiUrl, dados));
  }

  async editar(id: string, dados: UpdateUsuarioDTO): Promise<Usuario> {
    return await firstValueFrom(this.http.put<Usuario>(`${this.apiUrl}/${id}`, dados));
  }

  async excluir(id: string): Promise<void> {
    return await firstValueFrom(this.http.delete<void>(`${this.apiUrl}/${id}`));
  }
}
