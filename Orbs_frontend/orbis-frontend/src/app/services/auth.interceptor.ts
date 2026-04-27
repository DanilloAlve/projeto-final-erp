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

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(private authService: AuthService) {}

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
          switch (error.status) {
            case 401:
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
              return next.handle(this.addToken(request, newToken));
            }
          }
          this.refreshTokenSubject.error(new Error('Token refresh failed'));
          return throwError(() => new Error('Token refresh failed'));
        }),
        catchError(() => {
          this.isRefreshing = false;
          return throwError(() => new Error('Token refresh failed'));
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
