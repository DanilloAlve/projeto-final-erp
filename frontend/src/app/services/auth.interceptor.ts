import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject, from } from 'rxjs';
import { catchError, switchMap, take, filter } from 'rxjs/operators';
import { AuthService } from './auth';
import { ACCESS_TOKEN_KEY, API_URL } from './constants';
import {
  getFirstValidationErrorMessage,
  markAsHandledValidationError,
} from './http-error.utils';
import { MessageService } from './message.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  private readonly refreshRetryHeader = 'X-Refresh-Retry';

  constructor(
    private authService: AuthService
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const isApiRequest = request.url.startsWith(API_URL);
    if (!isApiRequest) {
      return next.handle(request);
    }

    const isAnonymousAuth =
      request.url === `${API_URL}/auth/login` || request.url === `${API_URL}/auth/refresh`;

    const token = this.authService.getAccessToken();
    if (token && !isAnonymousAuth) {
      request = this.addToken(request, token);
    }

    return next.handle(request).pipe(
      catchError((error) => {
        if (error instanceof HttpErrorResponse) {
          const alreadyRetried = request.headers.has(this.refreshRetryHeader);
          switch (error.status) {
            case 422: {
              const message = getFirstValidationErrorMessage(error);
              if (message && typeof window !== 'undefined') {
                markAsHandledValidationError(error);
                void MessageService.validationError(message);
              }
              return throwError(() => error);
            }
            case 401:
              if (isAnonymousAuth) {
                return throwError(() => error);
              }
              if (alreadyRetried) {
                void this.authService.logout();
                return throwError(() => error);
              }
              return this.handle401Error(request, next);
            case 403:
              return throwError(() => error);
            default:
              return throwError(() => error);
          }
        }
        return throwError(() => error);
      })
    );
  }

  private addToken(request: HttpRequest<any>, token: string) {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  private markAsRetried(request: HttpRequest<any>) {
    return request.clone({
      setHeaders: {
        [this.refreshRetryHeader]: '1',
      },
    });
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return from(this.authService.refreshAccessToken()).pipe(
        switchMap((success) => {
          this.isRefreshing = false;
          if (success) {
            const newToken = localStorage.getItem(ACCESS_TOKEN_KEY);
            if (newToken) {
              this.refreshTokenSubject.next(newToken);
              const retriedRequest = this.markAsRetried(this.addToken(request, newToken));
              return next.handle(retriedRequest);
            }
          }
          this.refreshTokenSubject.next(null);
          void this.authService.logout();
          return throwError(
            () =>
              new HttpErrorResponse({
                status: 401,
                statusText: 'Unauthorized',
                url: request.url,
              })
          );
        }),
        catchError(() => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(null);
          void this.authService.logout();
          return throwError(
            () =>
              new HttpErrorResponse({
                status: 401,
                statusText: 'Unauthorized',
                url: request.url,
              })
          );
        })
      );
    } else {
      return this.refreshTokenSubject.pipe(
        filter((token) => token != null),
        take(1),
        switchMap((token) => next.handle(this.addToken(request, token)))
      );
    }
  }
}
