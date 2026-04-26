import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import Swal from 'sweetalert2';
import { environment } from '../../../../environments/environment';
import { parseApiError } from '../../../core/http/api-error.util';

type Financeiro = {
  id: string;
  tipo: 'receita' | 'despesa';
  descricao: string;
  valor: number;
  status: 'pendente' | 'pago' | 'cancelado';
  data_vencimento: string;
  data_pagamento?: string;
};

@Component({
  selector: 'app-financeiro',
  imports: [ReactiveFormsModule, RouterLink, DatePipe, CurrencyPipe],
  templateUrl: './financeiro.component.html',
  styleUrl: './financeiro.component.scss'
})
export class FinanceiroComponent {
  private static readonly MAX_VALOR = 9_999_999.99;
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);
  private readonly apiBaseUrl = environment.apiBaseUrl;

  protected readonly registros = signal<Financeiro[]>([]);
  protected readonly loading = signal(false);
  protected readonly submitting = signal(false);
  protected readonly modalOpen = signal(false);
  protected readonly valorDisplay = signal('R$ 0,00');

  protected readonly form = this.fb.nonNullable.group({
    tipo: ['despesa' as 'receita' | 'despesa', [Validators.required]],
    descricao: ['', [Validators.required, Validators.minLength(3)]],
    valor: [0, [Validators.required, Validators.min(0.01), Validators.max(FinanceiroComponent.MAX_VALOR)]],
    data_vencimento: ['', [Validators.required]]
  });

  constructor() {
    this.loadRegistros();
  }

  protected openCreateModal(): void {
    this.resetForm();
    this.modalOpen.set(true);
  }

  protected closeModal(): void {
    if (this.submitting()) {
      return;
    }
    this.modalOpen.set(false);
    this.resetForm();
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.http
      .post(`${this.apiBaseUrl}/financeiro`, this.form.getRawValue())
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => {
          void Swal.fire({
            title: 'Sucesso',
            text: 'Registro financeiro cadastrado.',
            icon: 'success',
            confirmButtonText: 'OK'
          }).then((result) => {
            if (!result.isConfirmed) {
              return;
            }
            this.closeModal();
            this.loadRegistros();
          });
        },
        error: (error) => {
          const parsed = parseApiError(error, 'Falha ao cadastrar registro financeiro.');
          void Swal.fire('Erro', parsed.validationErrors[0] ?? parsed.message, 'error');
        }
      });
  }

  private resetForm(): void {
    this.form.reset({ tipo: 'despesa', descricao: '', valor: 0, data_vencimento: '' });
    this.valorDisplay.set('R$ 0,00');
  }

  protected onValorInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const onlyDigits = input.value.replace(/\D/g, '');
    const cents = Number(onlyDigits || '0');
    const numericValue = Math.min(cents / 100, FinanceiroComponent.MAX_VALOR);

    this.form.controls.valor.setValue(numericValue);
    this.valorDisplay.set(this.formatCurrency(numericValue));
  }

  protected onValorFocus(): void {
    if (this.form.controls.valor.value === 0) {
      this.valorDisplay.set('');
    }
  }

  protected onValorBlur(): void {
    const value = Math.min(this.form.controls.valor.value, FinanceiroComponent.MAX_VALOR);
    this.form.controls.valor.setValue(value);
    this.valorDisplay.set(this.formatCurrency(value));
  }

  protected onValorKeyDown(event: KeyboardEvent): void {
    const allowedControlKeys = [
      'Backspace',
      'Delete',
      'Tab',
      'Escape',
      'Enter',
      'ArrowLeft',
      'ArrowRight',
      'Home',
      'End'
    ];

    if (allowedControlKeys.includes(event.key)) {
      return;
    }

    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
    }
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  protected pagar(id: string): void {
    this.http.patch(`${this.apiBaseUrl}/financeiro/${id}/pagar`, {}).subscribe({
      next: () => {
        this.loadRegistros();
        void Swal.fire('Sucesso', 'Registro marcado como pago.', 'success');
      },
      error: (error) => {
        const parsed = parseApiError(error, 'Falha ao atualizar pagamento.');
        void Swal.fire('Erro', parsed.validationErrors[0] ?? parsed.message, 'error');
      }
    });
  }

  private loadRegistros(): void {
    this.loading.set(true);
    this.http
      .get<Financeiro[]>(`${this.apiBaseUrl}/financeiro`)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (data) => this.registros.set(data),
        error: (error) => {
          const parsed = parseApiError(error, 'Falha ao carregar financeiro.');
          void Swal.fire('Erro', parsed.validationErrors[0] ?? parsed.message, 'error');
        }
      });
  }
}
