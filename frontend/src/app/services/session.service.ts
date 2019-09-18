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
  private department$: Observable<Department>;
  private course$: ReplaySubject<Course> = new ReplaySubject<Course>(1);
  private courseSubscription: Subscription = new Subscription();

  constructor(private router: Router,
              private departmentService: DepartmentService,
              private courseService: CourseService) {
    this.router.events.pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => {
        const paramMap = this.router.routerState.root.firstChild.snapshot.paramMap;
        const departmentSlug = paramMap.get('department');
        const courseSlug = paramMap.get('course');

        this.courseSubscription.unsubscribe();

        if (departmentSlug) {
          this.department$ = this.departmentService.getBySlug(departmentSlug);

          if (courseSlug) {
            this.courseSubscription = this.courseService.getBySlug(departmentSlug, courseSlug)
              .subscribe((course) => this.course$.next(course));
          }
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
