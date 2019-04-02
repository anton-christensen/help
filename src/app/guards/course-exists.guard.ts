import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class CourseExistsGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
      const courseSlug = next.paramMap.get('course');
      return this.auth.isActualCourse(courseSlug)
        .then((isCourse) => {
          if(isCourse) return true;
          
          this.router.navigate(['/course-not-found']);
          return false;
        });
  }
  
}
