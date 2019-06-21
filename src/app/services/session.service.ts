import { Injectable } from '@angular/core';
import {CourseService} from './course.service';
import {InstituteService} from './institute.service';
import {Observable} from 'rxjs';
import {Course} from '../models/course';
import {Institute} from '../models/institute';
import {Router, NavigationEnd, Routes} from '@angular/router';
import { filter, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private institute$: Observable<Institute> = new Observable();
  private course$: Observable<Course> = new Observable();

  private institute: Institute;
  private course: Course;

  constructor(private router: Router,
              private instituteService: InstituteService,
              private courseService: CourseService) {

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event) => {
      const paramMap = this.router.routerState.root.firstChild.snapshot.paramMap;
      console.log("Institute: ", paramMap.get('institute'));
      console.log("Course: ", paramMap.get('course'));
    });
    this.institute$
      .subscribe((institute) => {
        this.institute = institute;
      });

    this.course$
      .subscribe((course) => {
        this.course = course;
      });
  }

  public setInstitute(slug: string): void {
    this.institute$ = this.instituteService.getBySlug(slug);
  }

  public getInstitute(): Observable<Institute> {
    return this.institute$;
  }

  public setCourse(slug: string): void {
    this.course$ = this.courseService.getBySlug(slug);
  }

  public getCourse$(): Observable<Course> {
    return this.course$;
  }

  public getCourse(): Course {
    return this.course;
  }
}
