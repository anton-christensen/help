import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  Router,
  CanActivateChild
} from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {ToastService} from '../services/toasts.service';
import {InstituteService} from '../services/institute.service';

@Injectable({
  providedIn: 'root'
})
export class InstituteExistsGuard implements CanActivate {
  constructor(private router: Router,
              private instituteService: InstituteService,
              private toastService: ToastService) {}

  canActivate(childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot):
  Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    const instituteSlug = childRoute.paramMap.get('institute');

    return this.instituteService.isActualInstitute(instituteSlug).pipe(
      map((exists) => {
        console.log("[GUARD] institute "+instituteSlug+" exists: ", exists);
        if (!exists) {
          this.toastService.add('Institute not found', 5000);
          return this.router.parseUrl('/institutes');
        }

        return exists;
      }));
  }
}
