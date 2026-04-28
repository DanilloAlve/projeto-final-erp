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

export type TipoFinanceiro = 'receita' | 'despesa';
export type StatusFinanceiro = 'pendente' | 'pago' | 'cancelado';

export interface RegistroFinanceiro {
  id: string;
  tipo: TipoFinanceiro;
  descricao: string;
  valor: number;
  status: StatusFinanceiro;
  data_vencimento: string;
  data_pagamento: string | null;
  created_at?: string;
}

type FinanceiroForm = {
  id?: string;
  tipo: TipoFinanceiro;
  descricao: string;
  valor: number;
  status: StatusFinanceiro;
  data_vencimento: string;
};

@Component({
  selector: 'app-financeiro',
  imports: [CommonModule, FormsModule, PageLayoutComponent, CurrencyInputComponent],
  templateUrl: './financeiro.html',
  styleUrl: './financeiro.css',
})
export class Financeiro {
  loading = signal(false);
  errorMessage = signal('');

  mostraModal = signal(false);
  salvando = signal(false);
  excluindo = signal(false);
  pagando = signal(false);

  formulario = signal<FinanceiroForm>(this.novoFormularioVazio());

  registros: RegistroFinanceiro[] = [];

  filtroBusca = '';
  filtroTipo: 'todos' | TipoFinanceiro = 'todos';
  filtroStatus: 'todos' | StatusFinanceiro = 'todos';

  constructor(private http: HttpClient) {
    void this.carregarRegistros();
  }

  private novoFormularioVazio(): FinanceiroForm {
    return {
      tipo: 'receita',
      descricao: '',
      valor: 0,
      status: 'pendente',
      data_vencimento: this.hojeIsoDate(),
    };
  }

  private hojeIsoDate(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private mapApi(r: any): RegistroFinanceiro {
    const rawVen = r.data_vencimento;
    const venStr =
      typeof rawVen === 'string'
        ? rawVen.split('T')[0]
        : rawVen instanceof Date
          ? this.toDateInputValue(rawVen.toISOString())
          : '';

    return {
      id: r.id,
      tipo: r.tipo,
      descricao: r.descricao,
      valor: Number(r.valor ?? 0),
      status: r.status,
      data_vencimento: venStr,
      data_pagamento: r.data_pagamento ? String(r.data_pagamento) : null,
      created_at: r.created_at ?? undefined,
    };
  }

  private toDateInputValue(iso: string | undefined): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  async carregarRegistros() {
    try {
      this.loading.set(true);
      this.errorMessage.set('');
      const response = await firstValueFrom(this.http.get<any[]>(`${API_URL}/financeiro`));
      this.registros = Array.isArray(response) ? response.map((r) => this.mapApi(r)) : [];
    } catch (error) {
      console.error('Erro ao carregar lançamentos financeiros:', error);
      this.errorMessage.set('Erro ao carregar lançamentos');
      this.registros = [];
    } finally {
      this.loading.set(false);
    }
  }

  get registrosFiltrados(): RegistroFinanceiro[] {
    const busca = this.filtroBusca.trim().toLowerCase();
    let list = [...this.registros];

    if (this.filtroTipo !== 'todos') {
      list = list.filter((r) => r.tipo === this.filtroTipo);
    }
    if (this.filtroStatus !== 'todos') {
      list = list.filter((r) => r.status === this.filtroStatus);
    }
    if (busca) {
      list = list.filter((r) => r.descricao.toLowerCase().includes(busca));
    }

    return list.sort((a, b) => a.data_vencimento.localeCompare(b.data_vencimento));
  }

  get totalReceitasFiltrado(): number {
    return this.registrosFiltrados.filter((r) => r.tipo === 'receita').reduce((acc, r) => acc + r.valor, 0);
  }

  get totalDespesasFiltrado(): number {
    return this.registrosFiltrados.filter((r) => r.tipo === 'despesa').reduce((acc, r) => acc + r.valor, 0);
  }

  get saldoFiltrado(): number {
    return this.totalReceitasFiltrado - this.totalDespesasFiltrado;
  }

  private formatBRL(value: number) {
    const v = Number(value ?? 0);
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  }

  formatValor(v: number) {
    return this.formatBRL(v);
  }

  /** Exibe data YYYY-MM-DD sem deslocamento de fuso. */
  formatDiaMesAno(ymd: string) {
    if (!ymd || ymd.length < 10) return '-';
    const [y, m, d] = ymd.split('-');
    if (!y || !m || !d) return '-';
    return `${d}/${m}/${y}`;
  }

  labelTipo(t: TipoFinanceiro) {
    return t === 'receita' ? 'Receita' : 'Despesa';
  }

  labelStatus(s: StatusFinanceiro) {
    switch (s) {
      case 'pendente':
        return 'Pendente';
      case 'pago':
        return 'Pago';
      case 'cancelado':
        return 'Cancelado';
      default:
        return s;
    }
  }

  abrirModalNovo() {
    this.formulario.set(this.novoFormularioVazio());
    this.mostraModal.set(true);
  }

  abrirModalEditar(r: RegistroFinanceiro) {
    this.formulario.set({
      id: r.id,
      tipo: r.tipo,
      descricao: r.descricao,
      valor: r.valor,
      status: r.status,
      data_vencimento: this.toDateInputValue(r.data_vencimento),
    });
    this.mostraModal.set(true);
  }

  fecharModal() {
    this.mostraModal.set(false);
  }

  private atualizarCampo<K extends keyof FinanceiroForm>(campo: K, valor: FinanceiroForm[K]) {
    const atual = this.formulario();
    this.formulario.set({ ...atual, [campo]: valor });
  }

  onCampoTexto(campo: 'descricao', valor: string) {
    this.atualizarCampo(campo, valor);
  }

  onCampoSelect<K extends 'tipo' | 'status'>(campo: K, valor: string) {
    this.atualizarCampo(campo, valor as FinanceiroForm[K]);
  }

  onValorChange(valor: string | number) {
    const parsed = Number(valor);
    this.atualizarCampo('valor', Number.isNaN(parsed) ? 0 : parsed);
  }

  onDataVencimento(valor: string) {
    this.atualizarCampo('data_vencimento', valor);
  }

  private buildPayloadFromForm(form: FinanceiroForm) {
    const payload: Record<string, unknown> = {
      tipo: form.tipo,
      descricao: form.descricao.trim(),
      valor: Number(form.valor),
      data_vencimento: form.data_vencimento,
      status: form.status,
    };
    return payload;
  }

  async salvar() {
    const form = this.formulario();
    if (form.descricao.trim().length < 3) {
      void MessageService.validationError('Informe uma descrição com pelo menos 3 caracteres');
      return;
    }
    if (form.valor === null || form.valor === undefined || Number.isNaN(Number(form.valor)) || Number(form.valor) <= 0) {
      void MessageService.validationError('Informe um valor maior que zero');
      return;
    }
    if (!form.data_vencimento?.trim()) {
      void MessageService.validationError('Informe a data de vencimento');
      return;
    }

    try {
      this.salvando.set(true);
      const payload = this.buildPayloadFromForm(form);
      const msgOk = form.id ? 'Lançamento atualizado com sucesso' : 'Lançamento criado com sucesso';

      if (form.id) {
        await firstValueFrom(this.http.put(`${API_URL}/financeiro/${form.id}`, payload));
      } else {
        await firstValueFrom(this.http.post(`${API_URL}/financeiro`, payload));
      }

      await this.carregarRegistros();
      await MessageService.success(msgOk);
      this.fecharModal();
    } catch (error) {
      console.error('Erro ao salvar lançamento:', error);
      if (isHandledValidationError(error)) return;
      const message = MessageService.extractErrorMessage(error, 'Erro ao salvar lançamento');
      void MessageService.error(message);
    } finally {
      this.salvando.set(false);
    }
  }

  async marcarComoPago(r: RegistroFinanceiro) {
    if (r.status !== 'pendente') return;
    try {
      this.pagando.set(true);
      await firstValueFrom(this.http.patch(`${API_URL}/financeiro/${r.id}/pagar`, {}));
      await this.carregarRegistros();
      await MessageService.success('Lançamento marcado como pago');
    } catch (error) {
      console.error('Erro ao registrar pagamento:', error);
      if (isHandledValidationError(error)) return;
      const message = MessageService.extractErrorMessage(error, 'Erro ao registrar pagamento');
      void MessageService.error(message);
    } finally {
      this.pagando.set(false);
    }
  }

  async excluir(r: RegistroFinanceiro) {
    const ok = await MessageService.confirmDelete('Tem certeza que deseja excluir este lançamento?');
    if (!ok) return;

    try {
      this.excluindo.set(true);
      await firstValueFrom(this.http.delete(`${API_URL}/financeiro/${r.id}`));
      await this.carregarRegistros();
      this.fecharModal();
      await MessageService.success('Lançamento excluído');
    } catch (error) {
      console.error('Erro ao excluir lançamento:', error);
      if (isHandledValidationError(error)) return;
      const message = MessageService.extractErrorMessage(error, 'Erro ao excluir lançamento');
      void MessageService.error(message);
    } finally {
      this.excluindo.set(false);
    }
  }
}
