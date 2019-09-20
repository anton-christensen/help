import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {map, shareReplay} from 'rxjs/operators';
import {Course} from '../models/course';
import {Observable} from 'rxjs';
import {environment} from '../../environments/environment';
import {RequestCache} from '../utils/request-cache';

@Injectable({
  providedIn: 'root'
})
export class CourseService {
  private readonly allAssociated: Observable<Course[]>;

  private readonly bySlug = new RequestCache<{departmentSlug: string, courseSlug: string}, Course>(({departmentSlug, courseSlug}) => {
    return this.http.get<Course>(`${environment.api}/departments/${departmentSlug}/courses/${courseSlug}`).pipe(
      shareReplay(1)
    );
  });

  private readonly byDepartment = new RequestCache<string, Course[]>((departmentSlug: string) => {
    return this.http.get<Course[]>(`${environment.api}/departments/${departmentSlug}/courses`).pipe(
      shareReplay(1)
    );
  });

  constructor(private http: HttpClient) {
    this.allAssociated = this.http.get<Course[]>(`${environment.api}/courses`).pipe(
      shareReplay(1)
    );
  }

  public getAllAssociated(): Observable<Course[]> {
    return this.allAssociated;
  }

  public getBySlug(departmentSlug: string, courseSlug: string): Observable<Course> {
    return this.bySlug.getObservable({departmentSlug, courseSlug}).pipe(
      map((courses) => courses[0])
    );
  }

  public getRelevantByDepartment(departmentSlug: string): Observable<Course[]> {
    return this.byDepartment.getObservable(departmentSlug);
  }

  public isActualCourse(departmentSlug: string, courseSlug: string): Observable<boolean> {
    return this.getBySlug(departmentSlug, courseSlug).pipe(
      map((course) => {
        return !!course;
      })
    );
  }

  public setEnabled(course: Course, enabled: boolean): Observable<Course> {
    if (enabled) {
      return this.http.put<Course>(`${environment.api}/departments/${course.departmentSlug}/courses/${course.slug}`, {
        enabled,
        numTrashCansThisSession: 0
      });
    } else {
      return this.http.put<Course>(`${environment.api}/departments/${course.departmentSlug}/courses/${course.slug}`, {
        enabled,
      });
    }
  }

  public delete(course: Course): Observable<any> {
    return this.http.delete<Course>(`${environment.api}/departments/${course.departmentSlug}/courses/${course.slug}`);
  }

  public createOrUpdate(course: Course): Observable<Course> {
    if (!course.id) {
      // New course
      return this.http.post<Course>(`${environment.api}/courses`, course);
    } else {
      // Course already exists, update
      return this.http.put<Course>(`${environment.api}/departments/${course.departmentSlug}/courses/${course.slug}`, course);
    }
  }
}
