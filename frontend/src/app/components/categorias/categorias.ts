import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { API_URL } from '../../services/constants';
import { isHandledValidationError } from '../../services/http-error.utils';
import { MessageService } from '../../services/message.service';
import { PageLayoutComponent } from '../layout/page-layout';

export interface Categoria {
  id: string;
  nome: string;
  descricao: string | null;
  status: boolean;
  created_at?: string;
}

type CategoriaForm = {
  id?: string;
  nome: string;
  descricao: string;
  status: boolean;
};

@Component({
  selector: 'app-categorias',
  imports: [CommonModule, FormsModule, PageLayoutComponent],
  templateUrl: './categorias.html',
  styleUrl: './categorias.css',
})
export class Categorias {
  loading = signal(false);
  errorMessage = signal('');

  mostraModal = signal(false);
  salvando = signal(false);
  excluindo = signal(false);
  formulario = signal<CategoriaForm>({
    nome: '',
    descricao: '',
    status: true,
  });

  categorias: Categoria[] = [];

  constructor(
    private http: HttpClient
  ) {
    this.carregarCategorias();
  }

  private mapApiCategoria(c: any): Categoria {
    return {
      id: c.id_cat ?? c.id,
      nome: c.nome,
      descricao: c.descricao ?? null,
      status: Boolean(c.status ?? c.ativo ?? true),
      created_at: c.created_at ?? undefined,
    };
  }

  async carregarCategorias() {
    try {
      this.loading.set(true);
      this.errorMessage.set('');

      const response = await firstValueFrom(this.http.get<any[]>(`${API_URL}/categorias`));
      this.categorias = Array.isArray(response) ? response.map((c) => this.mapApiCategoria(c)) : [];
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      this.errorMessage.set('Erro ao carregar categorias');
    } finally {
      this.loading.set(false);
    }
  }

  abrirModalNovo() {
    this.formulario.set({
      nome: '',
      descricao: '',
      status: true,
    });
    this.mostraModal.set(true);
  }

  private atualizarCampo<K extends keyof CategoriaForm>(campo: K, valor: CategoriaForm[K]) {
    const atual = this.formulario();
    this.formulario.set({ ...atual, [campo]: valor });
  }

  onCampoTextoChange(campo: 'nome' | 'descricao', valor: string) {
    this.atualizarCampo(campo, valor);
  }

  onStatusChange(valor: string) {
    this.atualizarCampo('status', valor === 'true');
  }

  abrirModalEditar(categoria: Categoria) {
    this.formulario.set({
      id: categoria.id,
      nome: categoria.nome,
      descricao: categoria.descricao ?? '',
      status: categoria.status,
    });
    this.mostraModal.set(true);
  }

  fecharModal() {
    this.mostraModal.set(false);
  }

  private buildPayloadFromForm(form: CategoriaForm) {
    return {
      nome: form.nome.trim(),
      descricao: form.descricao ? form.descricao : null,
      status: Boolean(form.status),
    };
  }

  async salvarCategoria() {
    const form = this.formulario();
    if (!form.nome.trim()) {
      void MessageService.validationError('Preencha o nome da categoria');
      return;
    }

    try {
      this.salvando.set(true);
      const payload = this.buildPayloadFromForm(form);

      if (form.id) {
        await firstValueFrom(this.http.put(`${API_URL}/categorias/${form.id}`, payload));
      } else {
        await firstValueFrom(this.http.post(`${API_URL}/categorias`, payload));
      }

      await this.carregarCategorias();
      this.fecharModal();
    } catch (error) {
      console.error('Erro ao salvar categoria:', error);
      if (isHandledValidationError(error)) return;
      const message = MessageService.extractErrorMessage(error, 'Erro ao salvar categoria');
      void MessageService.error(message);
    } finally {
      this.salvando.set(false);
    }
  }

  async excluirCategoria(categoria: Categoria) {
    await this.excluirCategoriaPorId(categoria.id);
  }

  private async excluirCategoriaPorId(id: string) {
    const ok = await MessageService.confirmDelete('Tem certeza que deseja excluir esta categoria?');
    if (!ok) return;

    try {
      this.excluindo.set(true);
      await firstValueFrom(this.http.delete(`${API_URL}/categorias/${id}`));
      await this.carregarCategorias();
      this.fecharModal();
    } catch (error) {
      console.error('Erro ao excluir categoria:', error);
      if (isHandledValidationError(error)) return;
      const message = MessageService.extractErrorMessage(error, 'Erro ao excluir categoria');
      void MessageService.error(message);
    } finally {
      this.excluindo.set(false);
    }
  }
}
