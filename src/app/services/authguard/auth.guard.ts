import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { Helper } from 'src/models/helper.models';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(public router: Router) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    if (Helper.getLoggedInUser() != null && Helper.getToken() != null) {
      if (route.routeConfig?.path == "login" || route.routeConfig?.path == "verification") {
        return this.router.navigate(['dashboard']);
      } else {
        return true;
      }
    } else {
      if (route.routeConfig?.path == "login" || route.routeConfig?.path == "verification") {
        return true;
      } else {
        return this.router.navigate(['login']);
      }
    }
  }

}
