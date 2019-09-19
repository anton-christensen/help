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
  private department$: Observable<Department> = new Observable<Department>();

  private currentCourseSlug: string;
  private course$: Observable<Course> = new Observable<Course>();

  constructor(private router: Router,
              private departmentService: DepartmentService,
              private courseService: CourseService) {
    this.router.events.pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => {
        const paramMap = this.router.routerState.root.firstChild.snapshot.paramMap;

        const departmentSlug = paramMap.get('department');
        if (departmentSlug && departmentSlug !== this.currentDepartmentSlug) {
          this.currentDepartmentSlug = departmentSlug;
          this.department$ = this.departmentService.getBySlug(departmentSlug);
        }

        const courseSlug = paramMap.get('course');
        if (courseSlug && courseSlug !== this.currentCourseSlug) {
          this.currentCourseSlug = courseSlug;
          this.course$ = this.courseService.getBySlug(departmentSlug, courseSlug);
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
