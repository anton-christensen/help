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
  private institute;
  private course$: ReplaySubject<Course> = new ReplaySubject<Course>(1);
  private courseSubscription: Subscription = new Subscription();

  constructor(private router: Router,
              private instituteService: InstituteService,
              private courseService: CourseService) {
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd)
    )
      .subscribe((event) => {
        const paramMap = this.router.routerState.root.firstChild.snapshot.paramMap;
        const instituteSlug = paramMap.get('institute');
        const courseSlug = paramMap.get('course');

        this.courseSubscription.unsubscribe();

        if (instituteSlug) {
          this.institute = this.instituteService.getBySlug(instituteSlug);

          if (courseSlug) {
            this.courseSubscription = this.courseService.getBySlug(instituteSlug, courseSlug)
              .subscribe((course) => this.course$.next(course));
          }
        }
      });
  }

  public getInstitute(): Institute {
    return this.institute;
  }

  public getCourse$(): Observable<Course> {
    return this.course$;
  }
}
