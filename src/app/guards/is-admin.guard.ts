import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class IsAdminGuard implements CanActivate {
  constructor(private router: Router,
              private auth: AuthService) {}

  canActivate(): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    const isAdmin = this.auth.isAdmin();
    return new Promise<boolean>((resolve, reject) => {
      return this.auth.user$.subscribe(user => {
        if(user && user.admin)
          resolve(true);
        else {
          this.router.navigateByUrl('/courses');
        }
      });
    });
  }
}
