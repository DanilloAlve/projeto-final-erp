import Swal from 'sweetalert2';
import { HttpErrorResponse } from '@angular/common/http';

export class MessageService {
  static extractErrorMessage(error: unknown, fallbackMessage: string) {
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
    }

    if (error && typeof error === 'object' && 'message' in error) {
      const message = (error as { message?: unknown }).message;
      if (typeof message === 'string' && message.trim().length > 0) {
        return message.trim();
      }
    }

    return fallbackMessage;
  }

  static validationError(message: string) {
    return Swal.fire({
      icon: 'error',
      title: 'Erro de validação',
      text: message,
      confirmButtonText: 'OK',
    });
  }

  static error(message: string, title = 'Erro') {
    return Swal.fire({
      icon: 'error',
      title,
      text: message,
      confirmButtonText: 'OK',
    });
  }

  static success(message: string, title = 'Sucesso') {
    return Swal.fire({
      icon: 'success',
      title,
      text: message,
      confirmButtonText: 'OK',
    });
  }

  static async confirmDelete(message: string) {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Confirma exclusão',
      text: message,
      showCancelButton: true,
      confirmButtonText: 'Excluir',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
    });

    return result.isConfirmed;
  }
}
