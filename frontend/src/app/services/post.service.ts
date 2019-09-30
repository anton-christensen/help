import {Injectable} from '@angular/core';
import {RequestCache} from '../utils/request-cache';
import {Post} from '../models/post';
import {HttpClient} from '@angular/common/http';
import {shareReplay} from 'rxjs/operators';
import {Course} from '../models/course';
import {Observable} from 'rxjs';
import {environment} from '../../environments/environment';
import {getListStreamObservable} from '../utils/stream-http';


@Injectable({
  providedIn: 'root'
})
export class PostService {
  private readonly byCourse = new RequestCache<{departmentSlug: string, courseSlug: string}, Post[]>(({departmentSlug, courseSlug}) => {
    return getListStreamObservable<Post>(`${environment.api}/departments/${departmentSlug}/courses/${courseSlug}/posts`).pipe(
      shareReplay(1)
    );
  }, 2500);

  constructor(private http: HttpClient) {}

  getAllByCourse(course: Course): Observable<Post[]> {
    return this.byCourse.getObservable({departmentSlug: course.departmentSlug, courseSlug: course.slug});
  }

  public createOrUpdate(post: Post): Observable<Post> {
    if (!post.id) {
      // New post
      delete post.id;
      return this.http.post<Post>(`${environment.api}/departments/${post.departmentSlug}/courses/${post.courseSlug}/posts`, post);
    } else {
      // Post already exists, update content
      return this.http.put<Post>(`${environment.api}/departments/${post.departmentSlug}/courses/${post.courseSlug}/posts/${post.id}`, {
        content: post.content
      });
    }
  }

  public delete(post: Post): Observable<any> {
    return this.http.delete<Post>(`${environment.api}/departments/${post.departmentSlug}/courses/${post.courseSlug}/posts/${post.id}`);
  }
}
