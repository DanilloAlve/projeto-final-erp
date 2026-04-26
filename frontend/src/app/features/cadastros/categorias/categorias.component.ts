import { Component, NgZone, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import Swal from 'sweetalert2';
import { environment } from '../../../../environments/environment';
import { parseApiError } from '../../../core/http/api-error.util';

type Categoria = {
  id: string;
  nome: string;
  descricao?: string;
};

@Component({
  selector: 'app-categorias',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './categorias.component.html',
  styleUrl: './categorias.component.scss'
})
export class CategoriasComponent {
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);
  private readonly ngZone = inject(NgZone);
  private readonly apiBaseUrl = environment.apiBaseUrl;

  protected readonly categorias = signal<Categoria[]>([]);
  protected readonly loading = signal(false);
  protected readonly submitting = signal(false);
  protected readonly modalOpen = signal(false);
  protected readonly editingCategoriaId = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    nome: ['', [Validators.required]],
    descricao: ['']
  });

  constructor() {
    this.loadCategorias();
  }

  protected get isEditing(): boolean {
    return this.editingCategoriaId() !== null;
  }

  protected openCreateModal(): void {
    this.editingCategoriaId.set(null);
    this.resetForm();
    this.modalOpen.set(true);
  }

  protected openEditModal(categoria: Categoria): void {
    this.editingCategoriaId.set(categoria.id);
    this.form.reset({
      nome: categoria.nome ?? '',
      descricao: categoria.descricao ?? ''
    });
    this.modalOpen.set(true);
  }

  protected closeModal(): void {
    if (this.submitting()) {
      return;
    }
    this.modalOpen.set(false);
    this.editingCategoriaId.set(null);
    this.resetForm();
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const payload = {
      nome: raw.nome.trim(),
      descricao: raw.descricao?.trim() || null
    };
    const editingId = this.editingCategoriaId();
    const request$ = editingId
      ? this.http.put<Categoria>(`${this.apiBaseUrl}/categorias/${editingId}`, payload)
      : this.http.post<Categoria>(`${this.apiBaseUrl}/categorias`, payload);

    this.submitting.set(true);
    request$
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => {
          void Swal.fire({
            title: 'Sucesso',
            text: editingId ? 'Categoria atualizada com sucesso.' : 'Categoria cadastrada com sucesso.',
            icon: 'success',
            confirmButtonText: 'OK'
          }).then((result) => {
            if (!result.isConfirmed) {
              return;
            }
            this.closeModal();
            this.loadCategorias();
          });
        },
        error: (error) => {
          const parsed = parseApiError(
            error,
            editingId ? 'Falha ao atualizar categoria.' : 'Falha ao cadastrar categoria.'
          );
          void Swal.fire('Erro', parsed.validationErrors[0] ?? parsed.message, 'error');
        }
      });
  }

  protected deleteCategoria(categoria: Categoria): void {
    void Swal.fire({
      title: 'Excluir categoria?',
      text: `Deseja remover "${categoria.nome}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Excluir',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#b42318'
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      this.http.delete<void>(`${this.apiBaseUrl}/categorias/${categoria.id}`).subscribe({
        next: () => {
          this.loadCategorias();
          void Swal.fire('Excluida', 'Categoria removida com sucesso.', 'success');
        },
        error: (error) => {
          const parsed = parseApiError(error, 'Falha ao excluir categoria.');
          void Swal.fire('Erro', parsed.validationErrors[0] ?? parsed.message, 'error');
        }
      });
    });
  }

  private resetForm(): void {
    this.form.reset({ nome: '', descricao: '' });
  }

  private loadCategorias(): void {
    this.ngZone.run(() => this.loading.set(true));
    this.http
      .get<Categoria[]>(`${this.apiBaseUrl}/categorias`)
      .subscribe({
        next: (data) => {
          this.ngZone.run(() => {
            this.categorias.set(data);
            this.loading.set(false);
          });
        },
        error: (error) => {
          this.ngZone.run(() => this.loading.set(false));
          const parsed = parseApiError(error, 'Falha ao carregar categorias.');
          void Swal.fire('Erro', parsed.validationErrors[0] ?? parsed.message, 'error');
        }
      });
  }
}
