import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  async canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<boolean | UrlTree> {
    if (this.authService.isAuthenticated()) {
      return true;
    }

    // On full page reload, auth restoration via refresh token can still be in-flight.
    // Wait for a refresh attempt before deciding to block the route.
    if (this.authService.getRefreshToken()) {
      const refreshed = await this.authService.refreshAccessToken();
      if (refreshed) {
        return true;
      }
    }

    return this.router.createUrlTree(['/login']);
  }
}
