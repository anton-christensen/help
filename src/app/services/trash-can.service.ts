import { Injectable } from '@angular/core';
import {Observable, of} from 'rxjs';
import { TrashCan } from '../models/trash-can';
import {map, mergeMap, switchMap} from 'rxjs/operators';
import { AngularFirestore } from '@angular/fire/firestore';
import {AuthService} from './auth.service';
import {User} from '../models/user';
import {Course} from '../models/course';
import {Post} from '../models/post';

@Injectable({
  providedIn: 'root'
})
export class TrashCanService {

  constructor(private db: AngularFirestore,
              private auth: AuthService) {}

  public getTrashById(id: string): Observable<TrashCan> {
    return this.db.doc<TrashCan>(`trash-cans/${id}`).valueChanges();
  }

  public getMyTrashCanByUser(course: Course): Observable<TrashCan> {
    return this.auth.user$.pipe(
      switchMap((user) => {
        if (!user) {
          return of(null);
        }

        return this.db.collection<TrashCan>('trash-cans', (ref) => {
          return ref
            .where('active', '==', true)
            .where('course', '==', course.slug)
            .where('uid', '==', user.uid)
            .limit(1);
        }).snapshotChanges().pipe(
          map(actions => {
            return actions.map(a => {
              const data = a.payload.doc.data();
              const id = a.payload.doc.id;
              return {id, ...data};
            });
          }),
          mergeMap((result) => {
            return result.length ? result : [null];
          }));
      })
    );


  }

  public getTrashCans(course: Course): Observable<TrashCan[]> {
    return this.db.collection<TrashCan>('trash-cans', (ref) => {
      return ref
        .where('active', '==', true)
        .where('course', '==', course.slug)
        .orderBy('created', 'desc');
    }).snapshotChanges().pipe(
      map(actions => {
        return actions.map(a => {
          const data = a.payload.doc.data();
          const id = a.payload.doc.id;
          return {id, ...data};
        });
      }));
  }

  public addTrashCan(course: string, room: string): Promise<TrashCan> {
    const id = this.db.collection<TrashCan>('trash-cans').ref.doc().id;
    const ref = this.db.collection<TrashCan>('trash-cans').doc(id);
    const trashCan = new TrashCan(id, this.auth.user.uid, course, room);
    
    return ref.set(Object.assign({}, trashCan))
      .then(() => {
        return trashCan;
      });
  }

  public deleteTrashCan(trashCan: TrashCan): Promise<any> {
    return this.db.collection<TrashCan>('trash-cans').ref.doc(trashCan.id).update('active', false);
  }
}
