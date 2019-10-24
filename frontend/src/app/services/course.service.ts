import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {map, shareReplay} from 'rxjs/operators';
import {Course} from '../models/course';
import {Observable} from 'rxjs';
import {environment} from '../../environments/environment';
import {RequestCache} from '../utils/request-cache';
import {getSingleStreamObservable} from '../utils/stream-http';
import {APIResponse, responseAdapter} from '../models/api-response';

@Injectable({
  providedIn: 'root'
})
export class CourseService {
  private readonly allAssociated = new RequestCache<{}, Course[]>(() => {
    return this.http.get<APIResponse<Course[]>>(`${environment.api}/courses`).pipe(
      map((response) => responseAdapter<Course[]>(response)),
      map((courses) => courses === null ? [] : courses.sort((a, b) => a.title.localeCompare(b.title)))
    )
  });

  private readonly bySlugStream = new RequestCache<{departmentSlug: string, courseSlug: string}, Course>(({departmentSlug, courseSlug}) => {
    return getSingleStreamObservable<Course>(`${environment.api}/departments/${departmentSlug}/courses/${courseSlug}`);
  }, -1);

  private readonly bySlug = new RequestCache<{departmentSlug: string, courseSlug: string}, Course>(({departmentSlug, courseSlug}) => {
    return this.http.get<APIResponse<Course>>(`${environment.api}/departments/${departmentSlug}/courses/${courseSlug}`).pipe(
      map((response) => responseAdapter<Course>(response))
    );
  }, 5000);

  private readonly byDepartment = new RequestCache<string, Course[]>((departmentSlug: string) => {
    return this.http.get<APIResponse<Course[]>>(`${environment.api}/departments/${departmentSlug}/courses`).pipe(
      map((response) => responseAdapter<Course[]>(response)),
      map((courses) => courses === null ? [] : courses.sort((a, b) => a.title.localeCompare(b.title))),
    );
  }, 5000);

  constructor(private http: HttpClient) {}

  public getAllAssociated(force = false): Observable<Course[]> {
    return this.allAssociated.getObservable({}, force);
  }

  public getStreamBySlug(departmentSlug: string, courseSlug: string): Observable<Course> {
    return this.bySlugStream.getObservable({departmentSlug, courseSlug});
  }

  public getBySlug(departmentSlug: string, courseSlug: string): Observable<Course> {
    return this.bySlug.getObservable({departmentSlug, courseSlug});
  }

  public getRelevantByDepartment(departmentSlug: string, force = false): Observable<Course[]> {
    return this.byDepartment.getObservable(departmentSlug, force);
  }

  public isActualCourse(departmentSlug: string, courseSlug: string): Observable<boolean> {
    return this.bySlug.getObservable({departmentSlug, courseSlug}).pipe(
      map((course) => {
        return !!course;
      })
    );
  }

  public setEnabled(course: Course, enabled: boolean): Observable<Course> {
    if (enabled) {
      return this.http.put<APIResponse<Course>>(`${environment.api}/departments/${course.departmentSlug}/courses/${course.slug}`, {
        enabled,
        numTrashCansThisSession: 0
      }).pipe(
        map((response) => responseAdapter<Course>(response))
      );
    } else {
      return this.http.put<APIResponse<Course>>(`${environment.api}/departments/${course.departmentSlug}/courses/${course.slug}`, {
        enabled,
      }).pipe(
        map((response) => responseAdapter<Course>(response))
      );
    }
  }

  public delete(course: Course): Observable<any> {
    return this.http.delete<APIResponse<Course>>(`${environment.api}/departments/${course.departmentSlug}/courses/${course.slug}`).pipe(
      map((response) => responseAdapter<Course>(response))
    );
  }

  public createOrUpdate(course: Course, departmentSlug = "", courseSlug = ""): Observable<Course> {
    if (!course.id) {
      // New course
      return this.http.post<APIResponse<Course>>(`${environment.api}/courses`, course).pipe(
        map((response) => responseAdapter<Course>(response))
      );
    } else {
      // Course already exists, update
      return this.http.put<APIResponse<Course>>(`${environment.api}/departments/${departmentSlug}/courses/${courseSlug}`, course).pipe(
        map((response) => responseAdapter<Course>(response))
      );
    }
  }
}
