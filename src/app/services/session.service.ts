import {Injectable } from '@angular/core';
import {CourseService} from './course.service';
import {InstituteService} from './institute.service';
import {Observable, ReplaySubject, Subscription, Subject} from 'rxjs';
import {Course} from '../models/course';
import {Institute} from '../models/institute';
import {Router, NavigationEnd} from '@angular/router';
import {filter} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private institute$: ReplaySubject<Institute> = new ReplaySubject<Institute>(1);
  private instituteSubscription: Subscription = new Subscription();
  private course$: ReplaySubject<Course> = new ReplaySubject<Course>(1);
  private courseSubscription: Subscription = new Subscription();
  private currentRoute$: Subject<string> = new Subject<string>();

  constructor(private router: Router,
              private instituteService: InstituteService,
              private courseService: CourseService) {
    this.router.events.pipe(
      filter(event => {return event instanceof NavigationEnd;})
    )
      .subscribe((event) => {
        this.currentRoute$.next(this.router.routerState.snapshot.root.firstChild.routeConfig.path);
        const paramMap = this.router.routerState.root.firstChild.snapshot.paramMap;
        const instituteSlug = paramMap.get('institute');
        const courseSlug = paramMap.get('course');

        if (instituteSlug) {
          this.instituteSubscription.unsubscribe();
          this.instituteSubscription = this.instituteService.getBySlug(instituteSlug)
            .subscribe((institute) => this.institute$.next(institute));

          if (courseSlug) {
            this.courseSubscription.unsubscribe();
            this.courseSubscription = this.courseService.getBySlug(instituteSlug, courseSlug)
              .subscribe((course) => this.course$.next(course));
          }
        }
      });
  }

  public getInstitute$(): Observable<Institute> {
    return this.institute$;
  }

  public getCourse$(): Observable<Course> {
    return this.course$;
  }

  public getRoute() {
    return this.currentRoute$;
  }
}
