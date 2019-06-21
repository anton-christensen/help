import { Injectable } from '@angular/core';
import {CourseService} from './course.service';
import {InstituteService} from './institute.service';
import {Observable, Subject, AsyncSubject, ReplaySubject, Subscription} from 'rxjs';
import {Course} from '../models/course';
import {Institute} from '../models/institute';
import {Router, NavigationEnd, Routes} from '@angular/router';
import { filter, map, first } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private institute$: ReplaySubject<Institute> = new ReplaySubject<Institute>(1);
  private instituteSubscription: Subscription = new Subscription();
  private course$: ReplaySubject<Course> = new ReplaySubject<Course>(1);
  private courseSubscription: Subscription = new Subscription();

  constructor(private router: Router,
              private instituteService: InstituteService,
              private courseService: CourseService) {
    this.router.events.pipe(
      filter(event => false)
    ).subscribe((event) => {
      console.log("Routing event: ", event);
    });

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event) => {
      const paramMap = this.router.routerState.root.firstChild.snapshot.paramMap;
      const instituteSlug = paramMap.get('institute');
      const courseSlug = paramMap.get('course');
      console.log("Institute: ", instituteSlug);
      console.log("Course: ", courseSlug);

      if (instituteSlug) {
        this.instituteSubscription.unsubscribe();
        this.instituteSubscription = this.instituteService.getBySlug(instituteSlug)
        .subscribe(institute => {
          console.log("Got institute: ", institute);
          this.institute$.next(institute);
        });

        if (courseSlug) {
          this.courseSubscription.unsubscribe();
          this.courseSubscription = this.courseService.getBySlug(instituteSlug, courseSlug)
          .subscribe(course => {
            console.log("Got course: ", course);
            this.course$.next(course);
          });
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
}
