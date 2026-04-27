import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { API_URL } from '../../services/constants';
import { isHandledValidationError } from '../../services/http-error.utils';
import { MessageService } from '../../services/message.service';
import { PageLayoutComponent } from '../layout/page-layout';
import { CurrencyInputComponent } from '../currency-input/currency-input';

export interface Produto {
  id: string;
  nome: string;
  descricao: string | null;
  codigo: string;
  preco: number;
  estoque_atual: number;
  estoque_minimo: number;
  estoque_maximo: number | null;
  ativo: boolean;
  categoriaId?: string;
  created_at?: string;
}

type CategoriaOption = {
  id: string;
  nome: string;
};

type ProdutoForm = {
  id?: string;
  nome: string;
  descricao: string;
  codigo: string;
  preco: number;
  estoque_atual: number;
  estoque_minimo: number;
  estoque_maximo: number | null;
  ativo: boolean;
  categoriaId: string;
};

@Component({
  selector: 'app-produtos',
  imports: [CommonModule, FormsModule, PageLayoutComponent, CurrencyInputComponent],
  templateUrl: './produtos.html',
  styleUrl: './produtos.css',
})
export class Produtos {
  loading = signal(false);
  errorMessage = signal('');

  mostraModal = signal(false);
  salvando = signal(false);
  excluindo = signal(false);
  formulario = signal<ProdutoForm>({
    nome: '',
    descricao: '',
    codigo: '',
    preco: 0,
    estoque_atual: 0,
    estoque_minimo: 0,
    estoque_maximo: null,
    ativo: true,
    categoriaId: '',
  });

  produtos: Produto[] = [];
  categorias: CategoriaOption[] = [];

  constructor(
    private http: HttpClient
  ) {
    this.carregarProdutos();
    this.carregarCategorias();
  }

  private mapApiProduto(p: any): Produto {
    return {
      id: p.id_prod ?? p.id,
      nome: p.nome,
      descricao: p.descricao ?? null,
      codigo: p.codigo,
      preco: Number(p.preco),
      estoque_atual: Number(p.estoque_atual ?? 0),
      estoque_minimo: Number(p.estoque_minimo ?? 0),
      estoque_maximo: p.estoque_maximo === null || p.estoque_maximo === undefined ? null : Number(p.estoque_maximo),
      ativo: Boolean(p.ativo ?? true),
      categoriaId: p.categoria?.id ?? undefined,
      created_at: p.created_at ?? undefined,
    };
  }

  async carregarProdutos() {
    try {
      this.loading.set(true);
      this.errorMessage.set('');

      const response = await firstValueFrom(this.http.get<any[]>(`${API_URL}/produtos`));
      this.produtos = Array.isArray(response) ? response.map((p) => this.mapApiProduto(p)) : [];
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      this.errorMessage.set('Erro ao carregar produtos');
    } finally {
      this.loading.set(false);
    }
  }

  private mapApiCategoria(c: any): CategoriaOption {
    return {
      id: c.id_cat ?? c.id,
      nome: c.nome,
    };
  }

  async carregarCategorias() {
    try {
      const response = await firstValueFrom(this.http.get<any[]>(`${API_URL}/categorias`));
      this.categorias = Array.isArray(response) ? response.map((c) => this.mapApiCategoria(c)) : [];
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      this.categorias = [];
    }
  }

  abrirModalNovo() {
    void this.carregarCategorias();
    this.formulario.set({
      nome: '',
      descricao: '',
      codigo: '',
      preco: 0,
      estoque_atual: 0,
      estoque_minimo: 0,
      estoque_maximo: null,
      ativo: true,
      categoriaId: '',
    });
    this.mostraModal.set(true);
  }

  private atualizarCampo<K extends keyof ProdutoForm>(campo: K, valor: ProdutoForm[K]) {
    const atual = this.formulario();
    this.formulario.set({ ...atual, [campo]: valor });
  }

  onCampoTextoChange(campo: 'nome' | 'descricao' | 'codigo' | 'categoriaId', valor: string) {
    this.atualizarCampo(campo, valor);
  }

  onCampoNumeroChange(campo: 'preco' | 'estoque_atual' | 'estoque_minimo' | 'estoque_maximo', valor: string | number) {
    if (campo === 'estoque_maximo') {
      if (valor === '' || valor === null || valor === undefined) {
        this.atualizarCampo('estoque_maximo', null);
        return;
      }
      const parsed = Number(valor);
      this.atualizarCampo('estoque_maximo', Number.isNaN(parsed) ? null : parsed);
      return;
    }

    const parsed = Number(valor);
    this.atualizarCampo(campo, Number.isNaN(parsed) ? 0 : parsed);
  }

  onAtivoChange(valor: string) {
    this.atualizarCampo('ativo', valor === 'true');
  }

  abrirModalEditar(produto: Produto) {
    void this.carregarCategorias();
    this.formulario.set({
      id: produto.id,
      nome: produto.nome,
      descricao: produto.descricao ?? '',
      codigo: produto.codigo,
      preco: produto.preco,
      estoque_atual: produto.estoque_atual,
      estoque_minimo: produto.estoque_minimo,
      estoque_maximo: produto.estoque_maximo,
      ativo: produto.ativo,
      categoriaId: produto.categoriaId ?? '',
    });
    this.mostraModal.set(true);
  }

  fecharModal() {
    this.mostraModal.set(false);
  }

  private buildPayloadFromForm(form: ProdutoForm) {
    const payload: any = {
      nome: form.nome,
      codigo: form.codigo,
      descricao: form.descricao ? form.descricao : null,
      preco: Number(form.preco),
      estoque_atual: Number(form.estoque_atual),
      estoque_minimo: Number(form.estoque_minimo),
      estoque_maximo: form.estoque_maximo === null || form.estoque_maximo === undefined ? null : Number(form.estoque_maximo),
      ativo: Boolean(form.ativo),
    };

    const categoriaId = form.categoriaId?.trim();
    if (categoriaId) {
      payload.categoriaId = categoriaId;
    }
    return payload;
  }

  async salvarProduto() {
    const form = this.formulario();
    if (!form.nome.trim() || !form.codigo.trim()) {
      void MessageService.validationError('Preencha nome e código');
      return;
    }
    if (form.preco === null || form.preco === undefined || Number.isNaN(Number(form.preco)) || Number(form.preco) < 0) {
      void MessageService.validationError('Preencha o preço');
      return;
    }
    if (form.estoque_atual === null || form.estoque_atual === undefined || Number.isNaN(Number(form.estoque_atual)) || Number(form.estoque_atual) < 0) {
      void MessageService.validationError('Preencha o estoque atual');
      return;
    }
    if (form.estoque_minimo === null || form.estoque_minimo === undefined || Number.isNaN(Number(form.estoque_minimo)) || Number(form.estoque_minimo) < 0) {
      void MessageService.validationError('Preencha o estoque mínimo');
      return;
    }

    try {
      this.salvando.set(true);
      const payload = this.buildPayloadFromForm(form);
      const successMessage = form.id ? 'Produto atualizado com sucesso' : 'Produto criado com sucesso';

      if (form.id) {
        await firstValueFrom(this.http.put(`${API_URL}/produtos/${form.id}`, payload));
      } else {
        await firstValueFrom(this.http.post(`${API_URL}/produtos`, payload));
      }

      await this.carregarProdutos();
      await MessageService.success(successMessage);
      this.fecharModal();
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      if (isHandledValidationError(error)) return;
      const message = MessageService.extractErrorMessage(error, 'Erro ao salvar produto');
      void MessageService.error(message);
    } finally {
      this.salvando.set(false);
    }
  }

  async excluirProduto(produto: Produto) {
    await this.excluirProdutoPorId(produto.id);
  }

  private async excluirProdutoPorId(id: string) {
    const ok = await MessageService.confirmDelete('Tem certeza que deseja excluir este produto?');
    if (!ok) return;

    try {
      this.excluindo.set(true);
      await firstValueFrom(this.http.delete(`${API_URL}/produtos/${id}`));
      await this.carregarProdutos();
      this.fecharModal();
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      if (isHandledValidationError(error)) return;
      const message = MessageService.extractErrorMessage(error, 'Erro ao excluir produto');
      void MessageService.error(message);
    } finally {
      this.excluindo.set(false);
    }
  }
}
