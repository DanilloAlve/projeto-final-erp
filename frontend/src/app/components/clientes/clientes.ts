import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { API_URL } from '../../services/constants';
import { isHandledValidationError } from '../../services/http-error.utils';
import { MessageService } from '../../services/message.service';
import { PageLayoutComponent } from '../layout/page-layout';

type Cliente = {
  id: number;
  nome: string;
  cpf_cnpj: string;
  email: string | null;
  telefone: string | null;
};

type ClienteForm = {
  id?: number;
  nome: string;
  cpf_cnpj: string;
  email: string;
  telefone: string;
};

@Component({
  selector: 'app-clientes',
  imports: [CommonModule, FormsModule, PageLayoutComponent],
  templateUrl: './clientes.html',
  styleUrl: './clientes.css',
})
export class Clientes {
  loading = signal(false);
  salvando = signal(false);
  excluindo = signal(false);
  mostraModal = signal(false);
  errorMessage = signal('');

  clientes: Cliente[] = [];
  formulario = signal<ClienteForm>({
    nome: '',
    cpf_cnpj: '',
    email: '',
    telefone: '',
  });

  constructor(private http: HttpClient) {
    this.carregarClientes();
  }

  private mapApiCliente(c: any): Cliente {
    return {
      id: Number(c.id),
      nome: c.nome,
      cpf_cnpj: c.cpf_cnpj,
      email: c.email ?? null,
      telefone: c.telefone ?? null,
    };
  }

  async carregarClientes() {
    try {
      this.loading.set(true);
      this.errorMessage.set('');
      const response = await firstValueFrom(this.http.get<any[]>(`${API_URL}/clientes`));
      this.clientes = Array.isArray(response) ? response.map((c) => this.mapApiCliente(c)) : [];
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      this.errorMessage.set('Erro ao carregar clientes');
    } finally {
      this.loading.set(false);
    }
  }

  abrirModalNovo() {
    this.formulario.set({
      nome: '',
      cpf_cnpj: '',
      email: '',
      telefone: '',
    });
    this.mostraModal.set(true);
  }

  abrirModalEditar(cliente: Cliente) {
    this.formulario.set({
      id: cliente.id,
      nome: cliente.nome,
      cpf_cnpj: cliente.cpf_cnpj,
      email: cliente.email ?? '',
      telefone: cliente.telefone ?? '',
    });
    this.mostraModal.set(true);
  }

  fecharModal() {
    this.mostraModal.set(false);
  }

  private atualizarCampo<K extends keyof ClienteForm>(campo: K, valor: ClienteForm[K]) {
    this.formulario.set({
      ...this.formulario(),
      [campo]: valor,
    });
  }

  onCampoTextoChange(campo: 'nome' | 'cpf_cnpj' | 'email' | 'telefone', valor: string) {
    if (campo === 'cpf_cnpj') {
      const apenasDigitos = valor.replace(/\D/g, '').slice(0, 14);
      this.atualizarCampo(campo, apenasDigitos);
      return;
    }
    this.atualizarCampo(campo, valor);
  }

  bloquearTeclaNaoNumerica(event: KeyboardEvent) {
    const teclasPermitidas = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (teclasPermitidas.includes(event.key)) {
      return;
    }
    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
    }
  }

  tratarColagemCpfCnpj(event: ClipboardEvent) {
    event.preventDefault();
    const texto = event.clipboardData?.getData('text') ?? '';
    const apenasDigitos = texto.replace(/\D/g, '').slice(0, 14);
    this.atualizarCampo('cpf_cnpj', apenasDigitos);
  }

  formatarCpfCnpj(cpfCnpj: unknown): string {
    const valor = cpfCnpj === null || cpfCnpj === undefined ? '' : String(cpfCnpj);
    const apenasDigitos = valor.replace(/\D/g, '');
    if (apenasDigitos.length === 11) {
      return apenasDigitos.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    if (apenasDigitos.length === 14) {
      return apenasDigitos.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return valor;
  }

  private buildPayloadFromForm(form: ClienteForm) {
    return {
      nome: form.nome.trim(),
      cpf_cnpj: form.cpf_cnpj.trim(),
      email: form.email.trim() ? form.email.trim() : null,
      telefone: form.telefone.trim() ? form.telefone.trim() : null,
    };
  }

  async salvarCliente() {
    const form = this.formulario();
    if (!form.nome.trim() || !form.cpf_cnpj.trim()) {
      void MessageService.validationError('Preencha nome e CPF/CNPJ');
      return;
    }
    const tamanhoCpfCnpj = form.cpf_cnpj.trim().length;
    if (tamanhoCpfCnpj !== 11 && tamanhoCpfCnpj !== 14) {
      void MessageService.validationError('CPF/CNPJ deve conter 11 ou 14 dígitos');
      return;
    }

    try {
      this.salvando.set(true);
      const payload = this.buildPayloadFromForm(form);
      const successMessage = form.id ? 'Cliente atualizado com sucesso' : 'Cliente criado com sucesso';

      if (form.id) {
        await firstValueFrom(this.http.put(`${API_URL}/clientes/${form.id}`, payload));
      } else {
        await firstValueFrom(this.http.post(`${API_URL}/clientes`, payload));
      }

      await this.carregarClientes();
      await MessageService.success(successMessage);
      this.fecharModal();
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      if (isHandledValidationError(error)) return;
      const message = MessageService.extractErrorMessage(error, 'Erro ao salvar cliente');
      void MessageService.error(message);
    } finally {
      this.salvando.set(false);
    }
  }

  async excluirCliente(cliente: Cliente) {
    const ok = await MessageService.confirmDelete('Tem certeza que deseja excluir este cliente?');
    if (!ok) return;

    try {
      this.excluindo.set(true);
      await firstValueFrom(this.http.delete(`${API_URL}/clientes/${cliente.id}`));
      await this.carregarClientes();
      this.fecharModal();
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
      if (isHandledValidationError(error)) return;
      const message = MessageService.extractErrorMessage(error, 'Erro ao excluir cliente');
      void MessageService.error(message);
    } finally {
      this.excluindo.set(false);
    }
  }
}
