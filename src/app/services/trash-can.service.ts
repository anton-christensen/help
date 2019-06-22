import {Injectable} from '@angular/core';
import {Observable, of} from 'rxjs';
import {TrashCan} from '../models/trash-can';
import {switchMap} from 'rxjs/operators';
import {AngularFirestore, QueryFn} from '@angular/fire/firestore';
import {AuthService} from './auth.service';
import {User} from '../models/user';
import {Course} from '../models/course';
import {CommonService} from './common.service';

@Injectable({
  providedIn: 'root'
})
export class TrashCanService {

  constructor(private afStore: AngularFirestore,
              private auth: AuthService) {}

  public getAll() {
    return this.getMultiple(ref => ref);
  }

  public getOwnedByCourse(course: Course): Observable<TrashCan> {
    return this.auth.user$.pipe(
      switchMap((user) => {
        if (!user) {
          return of(null);
        } else {
          return this.getActiveByCourseAndUser(course, user);
        }
      })
    );
  }

  public getActiveByCourseAndUser(course: Course, user: User): Observable<TrashCan> {
    return this.getSingle((ref) => {
      return ref
        .where('active', '==', true)
        .where('instituteSlug', '==', course.instituteSlug)
        .where('courseSlug', '==', course.slug)
        .where('uid', '==', user.uid);
    });
  }

  public getActiveByCourse(course: Course): Observable<TrashCan[]> {
    return this.getMultiple((ref) => {
      return ref
        .where('active', '==', true)
        .where('instituteSlug', '==', course.instituteSlug)
        .where('courseSlug', '==', course.slug)
        .orderBy('created', 'desc');
    });
  }

  public addTrashCan(course: Course, room: string, uid: string): Promise<TrashCan> {
    const id = this.afStore.collection<TrashCan>('trash-cans').ref.doc().id;
    const ref = this.afStore.collection<TrashCan>('trash-cans').doc(id);
    const trashCan = new TrashCan(id, uid, course.instituteSlug, course.slug, room);

    return ref.set(Object.assign({}, trashCan))
      .then(() => {
        return trashCan;
      });
  }

  public deleteTrashCan(trashCan: TrashCan): Promise<any> {
    return this.afStore.collection<TrashCan>('trash-cans').ref.doc(trashCan.id).update('active', false);
  }

  private getSingle(qFn: QueryFn): Observable<TrashCan> {
    return CommonService.getSingle<TrashCan>(this.afStore, 'trash-cans', qFn);
  }

  private getMultiple(qFn: QueryFn): Observable<TrashCan[]> {
    return CommonService.getMultiple<TrashCan>(this.afStore, 'trash-cans', qFn);
  }
}
