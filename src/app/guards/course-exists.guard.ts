import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';
import {ToastService} from '../services/toasts.service';

@Injectable({
  providedIn: 'root'
})
export class CourseExistsGuard implements CanActivate {
  constructor(private router: Router,
              private auth: AuthService,
              private toastService: ToastService) {}

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
      const courseSlug = next.paramMap.get('course');
      return this.auth.isActualCourse(courseSlug)
        .then((isCourse) => {
          if (!isCourse) {
            this.toastService.add('Course not found - redirecting to courses page', 5000);
            this.router.navigateByUrl('/courses');
          }

          return isCourse;
        });
  }
}
