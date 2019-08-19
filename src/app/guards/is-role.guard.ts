import { Injectable } from '@angular/core';
import { CanActivate, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';
import {map} from 'rxjs/operators';
import { Role } from '../models/user';

function isRoleGenerator(acceptedRoles: Role[], auth: AuthService, router: Router) {
  return (): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree => {
    return auth.user$.pipe(
      map((user) => {
        if (!user || (user && !acceptedRoles.includes(user.role))) {
          return router.parseUrl('/');
        }
        return true;
      }));
  };
}

@Injectable({
  providedIn: 'root'
})
export class IsAdminGuard implements CanActivate {
  constructor(private router: Router,
              private auth: AuthService) {}

  canActivate = isRoleGenerator(['admin'], this.auth, this.router);
}

@Injectable({
  providedIn: 'root'
})
export class IsLecturerGuard implements CanActivate {
  constructor(private router: Router,
              private auth: AuthService) {}

  canActivate = isRoleGenerator(['admin', 'lecturer'], this.auth, this.router);
}

@Injectable({
  providedIn: 'root'
})
export class IsAssistantGuard implements CanActivate {
  constructor(private router: Router,
              private auth: AuthService) {}

    canActivate = isRoleGenerator(['admin', 'lecturer', 'assistant'], this.auth, this.router);
}
