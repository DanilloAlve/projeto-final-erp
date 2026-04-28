import { HttpErrorResponse } from '@angular/common/http';

type ValidationIssue = {
  message?: string;
};

type FlattenedValidation = {
  formErrors?: string[];
  fieldErrors?: Record<string, string[]>;
};

export function getFirstValidationErrorMessage(error: HttpErrorResponse): string | null {
  if (error.status !== 422) {
    return null;
  }

  const payload = error.error as
    | {
        message?: string;
        errors?: ValidationIssue[];
        details?: FlattenedValidation;
      }
    | undefined;

  const firstIssueMessage = payload?.errors?.find((issue) => typeof issue?.message === 'string')?.message?.trim();
  if (firstIssueMessage) {
    return firstIssueMessage;
  }

  const firstFormError = payload?.details?.formErrors?.find((msg) => typeof msg === 'string' && msg.trim().length > 0);
  if (firstFormError) {
    return firstFormError;
  }

  const fieldErrors = payload?.details?.fieldErrors;
  if (fieldErrors && typeof fieldErrors === 'object') {
    for (const messages of Object.values(fieldErrors)) {
      const firstFieldError = messages?.find((msg) => typeof msg === 'string' && msg.trim().length > 0);
      if (firstFieldError) {
        return firstFieldError;
      }
    }
  }

  if (typeof payload?.message === 'string' && payload.message.trim().length > 0) {
    return payload.message.trim();
  }

  return 'Dados inválidos.';
}

export function markAsHandledValidationError(error: HttpErrorResponse) {
  (error as HttpErrorResponse & { handledValidationError?: boolean }).handledValidationError = true;
}

export function isHandledValidationError(error: unknown): boolean {
  if (!(error instanceof HttpErrorResponse)) {
    return false;
  }
  return Boolean((error as HttpErrorResponse & { handledValidationError?: boolean }).handledValidationError);
}
