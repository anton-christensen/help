import { Injectable } from '@angular/core';
import { CanActivate, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

function isRoleGenerator(acceptedRoles: String[], auth: AuthService, router: Router) {
  return function(): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree { 
    return new Promise<boolean>((resolve) => {
      return auth.user$.subscribe(user => {
        if (user && acceptedRoles.includes(user.role)) {
          resolve(true);
        } else {
          router.navigateByUrl('/courses');
        }
      });
    });
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
export class IsTAGuard implements CanActivate {
  constructor(private router: Router,
    private auth: AuthService) {}

    canActivate = isRoleGenerator(['admin', 'lecturer', 'ta'], this.auth, this.router);
}