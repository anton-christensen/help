import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Course } from '../models/course';
import { map, mergeMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CourseService {
  constructor(private db: AngularFirestore) {}

  public getCourseBySlug(slug: string): Observable<Course> {
    return this.db.collection<Course>('courses', ref => ref.where('slug', '==', slug).limit(1)).snapshotChanges().pipe(
      map(actions => {
        return actions.map(a => {
            const data = a.payload.doc.data() as any;
            const id = a.payload.doc.id;
            return {id, ...data};
        });
      }),
      mergeMap((result) => {
          return result.length ? result : [null];
      })
    );
  }

  public getAllCourses(): Observable<Course[]> {
    return this.db.collection<Course>('courses').snapshotChanges().pipe(
      map(actions => {
        return actions.map(a => {
          const data = a.payload.doc.data();
          const id = a.payload.doc.id;
          return {id, ...data};
        });
      }));
  }

  public getEnabledCourses(): Observable<Course[]> {
    return this.db.collection<Course>('courses', ref => ref.where('enabled', '==', true)).snapshotChanges().pipe(
      map(actions => {
        return actions.map(a => {
        const data = a.payload.doc.data();
        const id = a.payload.doc.id;
        return {id, ...data};
      });
    }));
  }

  setCourseEnabled(course: Course) {
    return this.db.collection<Course>('courses').doc(course.id).update({enabled: course.enabled});
  }
}
