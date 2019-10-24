import {Injectable} from '@angular/core';
import {CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router} from '@angular/router';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {ToastService} from '../services/toasts.service';
import {DepartmentService} from '../services/department.service';

@Injectable({
  providedIn: 'root'
})
export class DepartmentExistsGuard implements CanActivate {
  constructor(private router: Router,
              private departmentService: DepartmentService,
              private toastService: ToastService) {}

  canActivate(childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot):
  Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    const departmentSlug = childRoute.paramMap.get('department');

    return this.departmentService.isActualDepartment(departmentSlug).pipe(
      map((exists) => {
        if (!exists) {
          this.toastService.add(`Department ${departmentSlug.toUpperCase()} not found`, 5000);
          return this.router.parseUrl('/departments');
        }

        return true;
      }));
  }
}
