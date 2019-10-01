import {Injectable} from '@angular/core';
import {RequestCache} from '../utils/request-cache';
import {HttpClient} from '@angular/common/http';
import {map, shareReplay, tap} from 'rxjs/operators';
import {TrashCan} from '../models/trash-can';
import {Course} from '../models/course';
import {Observable} from 'rxjs';
import {environment} from '../../environments/environment';
import {getListStreamObservable} from "../utils/stream-http";
import {APIResponse, responseAdapter} from '../models/api-response';

@Injectable({
  providedIn: 'root'
})
export class TrashCanService {
  private readonly byCourse = new RequestCache<{departmentSlug: string, courseSlug: string}, TrashCan[]>(({departmentSlug, courseSlug}) => {
    return getListStreamObservable<TrashCan>(`${environment.api}/departments/${departmentSlug}/courses/${courseSlug}/trashcans`).pipe(
      shareReplay(1)
    );
  }, 2500);

  constructor(private http: HttpClient) {}

  public getActiveByCourse(course: Course): Observable<TrashCan[]> {
    return this.byCourse.getObservable({departmentSlug: course.departmentSlug, courseSlug: course.slug});
  }

  public add(course: Course, room: string): Observable<TrashCan> {
    return this.http.post<APIResponse<TrashCan>>(`${environment.api}/departments/${course.departmentSlug}/courses/${course.slug}/trashcans`, {
      room,
    }).pipe(
      map((response) => responseAdapter<TrashCan>(response)),
    );
  }

  public delete(trashCan: TrashCan) {
    return this.http.delete<APIResponse<TrashCan>>(`${environment.api}/departments/${trashCan.departmentSlug}/courses/${trashCan.courseSlug}/trashcans/${trashCan.id}`).pipe(
      map((response) => responseAdapter<TrashCan>(response)),
    );
  }
}
