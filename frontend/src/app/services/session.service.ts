import {Injectable } from '@angular/core';
import {CourseService} from './course.service';
import {DepartmentService} from './department.service';
import {Observable, ReplaySubject, Subscription, Subject} from 'rxjs';
import {Course} from '../models/course';
import {Department} from '../models/department';
import {Router, NavigationEnd} from '@angular/router';
import {filter} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private currentDepartmentSlug: string;
  private departmentSub: Subscription;
  private department$: ReplaySubject<Department> = new ReplaySubject<Department>(1);

  private currentCourseSlug: string;
  private courseSub: Subscription;
  private course$: ReplaySubject<Course> = new ReplaySubject<Course>(1);

  constructor(private router: Router,
              private departmentService: DepartmentService,
              private courseService: CourseService) {
    this.router.events.pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => {
        const paramMap = this.router.routerState.root.firstChild.snapshot.paramMap;

        const departmentSlug = paramMap.get('department');
        if (departmentSlug) {
          if (departmentSlug !== this.currentDepartmentSlug) {
            if (this.departmentSub) {
              this.departmentSub.unsubscribe();
            }

            this.currentDepartmentSlug = departmentSlug;
            this.departmentSub = this.departmentService.getBySlug(departmentSlug)
              .subscribe((d) => this.department$.next(d));
          }
        } else {
          this.currentDepartmentSlug = '';
          this.department$.next(null);
        }

        const courseSlug = paramMap.get('course');
        if (courseSlug) {
          if (courseSlug !== this.currentCourseSlug) {
            if (this.courseSub) {
              this.courseSub.unsubscribe();
            }

            this.currentCourseSlug = courseSlug;
            this.courseSub = this.courseService.getStreamBySlug(departmentSlug, courseSlug)
              .subscribe((c) => this.course$.next(c), (e) => console.log('course error', e), () => console.log('course completed'));
          }
        } else {
          this.currentCourseSlug = '';
          this.course$.next(null);
        }
      });
  }

  public getDepartment(): Observable<Department> {
    return this.department$;
  }

  public getCourse$(): Observable<Course> {
    return this.course$;
  }
}
