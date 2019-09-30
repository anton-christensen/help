import {Injectable} from '@angular/core';
import {CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router} from '@angular/router';
import {Observable} from 'rxjs';
import {ToastService} from '../services/toasts.service';
import {map} from 'rxjs/operators';
import {CourseService} from '../services/course.service';

@Injectable({
  providedIn: 'root'
})
export class CourseExistsGuard implements CanActivate {
  constructor(private router: Router,
              private courseService: CourseService,
              private toastService: ToastService) {}

  public canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot):
    Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    const departmentSlug = next.paramMap.get('department');
    const courseSlug = next.paramMap.get('course');


    return this.courseService.isActualCourse(departmentSlug, courseSlug).pipe(
      map((exists) => {
        if (!exists) {
          this.toastService.add('Course not found', 5000);
          return this.router.parseUrl('/courses');
        }

        return true;
      }));
  }
}
