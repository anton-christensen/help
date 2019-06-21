import { Injectable } from '@angular/core';
import {AngularFirestore, QueryFn} from '@angular/fire/firestore';
import {Observable} from 'rxjs';
import {Course} from '../models/course';
import {map, mergeMap} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CommonService {
  constructor() { }

  public static documentIsCreatedDatePresent(document: {created: {seconds}}): boolean {
    return document && document.created && document.created.seconds;
  }

  public static getSingle<T>(db: AngularFirestore, path: string, qFn: QueryFn): Observable<T> {
    return db.collection<Course>(path, (ref) => {
      return qFn(ref).limit(1);
    }).snapshotChanges().pipe(
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

  public static getMultiple<T>(db: AngularFirestore, path: string, qFn: QueryFn): Observable<T[]> {
    return db.collection<T>(path, qFn).snapshotChanges().pipe(
      map(actions => {
        return actions.map(a => {
          const data = a.payload.doc.data();
          const id = a.payload.doc.id;
          return {id, ...data};
        });
      }));
  }
}
