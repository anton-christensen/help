import {Injectable} from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection, QueryFn} from '@angular/fire/firestore';
import {Observable, BehaviorSubject} from 'rxjs';
import {Course, CoursePath} from '../models/course';
import {CommonService} from './common.service';
import {map, scan, tap, take} from 'rxjs/operators';
import {User} from '../models/user';
import { filter } from 'minimatch';

@Injectable({
  providedIn: 'root'
})
export class CourseService {
  constructor(private afStore: AngularFirestore) {}

  public pageSize = 15;

  public getAll(): CoursePager {
    return new CoursePager(this.afStore,
      'courses',
      (ref) => ref.orderBy('instituteSlug', 'asc')
                  .orderBy('title', 'asc'),
      { limit: this.pageSize }
    );
  }

  public getBySlug(instituteSlug: string, courseSlug: string): Observable<Course> {
    return this.getSingle((ref) => {
      return ref
        .where('instituteSlug', '==', instituteSlug)
        .where('slug', '==', courseSlug);
    });
  }

  public getAllByLecturer(user: User): CoursePager {
    return new CoursePager(this.afStore, 'courses', (ref) => {
      return ref
        .where('associatedUserIDs', 'array-contains', user.id)
        .orderBy('instituteSlug', 'asc')
        .orderBy('title', 'asc');
      },
      {limit: this.pageSize}
    );
  }

  public getAllByInstitute(instituteSlug: string): CoursePager {
    return new CoursePager(this.afStore,
      'courses',
      (ref) => ref.where('instituteSlug', '==', instituteSlug)
                  .orderBy('title', 'asc'),
      { limit: this.pageSize }
    );
  }

  public getAllByLecturerAndInstitute(user: User, instituteSlug: string): CoursePager {
    return new CoursePager(this.afStore,
      'courses',
      (ref) => ref.where('instituteSlug', '==', instituteSlug)
                  .where('associatedUserIDs', 'array-contains', user.id)
                  .orderBy('title', 'asc'),
      { limit: this.pageSize }
    );
  }

  public getAllActiveByInstitute(instituteSlug: string): CoursePager {
    return new CoursePager(this.afStore,
      'courses',
      (ref) => ref.where('enabled', '==', true)
                  .where('instituteSlug', '==', instituteSlug)
                  .orderBy('title', 'asc'),
      { limit: this.pageSize }
    );
  }

  public isActualCourse(instituteSlug: string, courseSlug: string): Observable<boolean> {
    return this.getBySlug(instituteSlug, courseSlug).pipe(
      map((course) => {
        return !!course;
      })
    );
  }

  public setCourseEnabled(course: Course) {
    return this.afStore.collection<Course>(CoursePath).doc(course.id).update({enabled: course.enabled, numTrashCansThisSession: 0});
  }

  public deleteCourse(course: Course) {
    return this.afStore.collection<Course>(CoursePath).doc(course.id).delete();
  }

  public createOrUpdateCourse(course: Course): Promise<void> {
    if (!course.id) {
      // New course, get an autogenerated ID
      const id = this.afStore.collection<Course>(CoursePath).ref.doc().id;
      delete course.id;
      return this.afStore.collection<Course>(CoursePath).doc(id).set(course);
    } else {
      // Course already exists, just update the content
      const id = course.id;
      delete course.id;
      return this.afStore.collection<Course>(CoursePath).ref.doc(id).update(course);
    }
  }

  private getSingle(qFn: QueryFn): Observable<Course> {
    return CommonService.getSingle<Course>(this.afStore, CoursePath, qFn);
  }

  private getMultiple(qFn: QueryFn): Observable<Course[]> {
    return CommonService.getMultiple<Course>(this.afStore, CoursePath, qFn);
  }
}

interface QueryConfig {
  path: string; //  path to collection
  queryFunction: QueryFn; // query function to order and select with
  limit: number; // limit per query
  reverse: boolean; // reverse order?
  prepend: boolean; // prepend to source?
}

export class CoursePager {
  // Source data
  private _done = new BehaviorSubject(false);
  private _loading = new BehaviorSubject(false);
  private _data = new BehaviorSubject([]);

  private query: QueryConfig;

  // Observable data
  data: Observable<any>;
  done: Observable<boolean> = this._done.asObservable();
  loading: Observable<boolean> = this._loading.asObservable();

  // Initial query sets options and defines the Observable
  // passing opts will override the defaults
  constructor(private afs: AngularFirestore, path: string, queryFunction: QueryFn, opts?: any) {
    this.query = {
      path,
      queryFunction,
      limit: 2,
      reverse: false,
      prepend: false,
      ...opts
    };

    const first = this.afs.collection(this.query.path, (ref) => {
      return this.query.queryFunction(ref)
                       .limit(this.query.limit);
    });

    this.mapAndUpdate(first);

    // Create the observable array for consumption in components
    this.data = this._data.asObservable().pipe(
      scan( (acc: any[], val: any[]) => { 
        let newvals = [];
        for(let i = 0; i < val.length; i++) {
          let index = acc.findIndex( accItem => accItem.id == val[i].id);
          if(val[i].type === 'removed' && index !== -1) {
            acc.splice(index,1);
          }
          else if(index == -1) {
            newvals.push(val[i]);
          }
          else {
            acc[index] = val[i];
          }
        }

        let result = (this.query.prepend ? newvals.concat(acc) : acc.concat(newvals))
          .map(item => { 
            return {
              id: item.id,
              title: item.title, 
              slug: item.slug, 
              instituteSlug: item.instituteSlug, 
              enabled: item.enabled, 
              associatedUserIDs: item.associatedUserIDs
            } as Course;
          });
        return result;
      })
    );

  }

  public removeOneHack(removedCourse: Course) {
    let c = this._data.value.find(course => course.id === removedCourse.id);
    c.type = 'removed';
    this._data.next([c]);
  }

  // Retrieves additional data from firestore
  public more() {
    const cursor = this.getCursor();
    const more = this.afs.collection(this.query.path, (ref) => {
      return this.query.queryFunction(ref)
                       .limit(this.query.limit)
                       .startAfter(cursor);
    });
    this.mapAndUpdate(more);
  }


  // Determines the doc snapshot to paginate query 
  private getCursor() {
    const current = this._data.value
    if (current.length) {
      return this.query.prepend ? current[0].doc : current[current.length - 1].doc 
    }
    return null
  }


  // Maps the snapshot to usable format the updates source
  private mapAndUpdate(col: AngularFirestoreCollection<any>) {
    if (this._done.value || this._loading.value) { return; }

    // loading
    this._loading.next(true);

    // Map snapshot with doc ref (needed for cursor)
    return col.snapshotChanges().pipe(
      tap( arr => {
        let values = arr.map(snap => {
          const data = snap.payload.doc.data();
          // const data = snap.payload.doc.ref.get({source: 'server'});
          const doc = snap.payload.doc;
          const id = snap.payload.doc.id;
          const type = snap.type;
          return { ...data, doc, id, type };
        });
        
        // If prepending, reverse the batch order
        values = this.query.prepend ? values.reverse() : values;

        // update source with new values, done loading
        this._data.next(values);
        this._loading.next(false);

        // no more values, mark done
        if (values.length < this.query.limit && values.length !== 1) {
          this._done.next(true);
        }
      })
    ).subscribe();
  }

}
