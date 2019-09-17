import {Injectable} from '@angular/core';
import {Observable, of} from 'rxjs';
import {TrashCan, TrashCanPath} from '../models/trash-can';
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
  private activeByCourse: {slug: string, obs: Observable<TrashCan[]>}[] = [];

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
        .where('courseID', '==', course.id)
        .where('userID', '==', user.id);
    });
  }

  public getActiveByCourse(course: Course): Observable<TrashCan[]> {
    let obj = this.activeByCourse.find(({slug}) => slug === course.slug);
    if (obj) {
      return obj.obs;
    } else {
      obj = {
        slug: course.slug,
        obs: this.getMultiple((ref) => {
          return ref
            .where('active', '==', true)
            .where('courseID', '==', course.id)
            .orderBy('created', 'desc');
        })
      };
      this.activeByCourse.push(obj);
    }

    return obj.obs;
  }

  public addTrashCan(course: Course, room: string, uid: string): Promise<TrashCan> {
    const id = this.afStore.collection<TrashCan>(TrashCanPath).ref.doc().id;
    const ref = this.afStore.collection<TrashCan>(TrashCanPath).doc(id);
    const trashCan = new TrashCan(id, uid, course.id, room);

    return ref.set(Object.assign({}, trashCan))
      .then(() => {
        return trashCan;
      });
  }

  public deleteTrashCan(trashCan: TrashCan): Promise<any> {
    return this.afStore.collection<TrashCan>(TrashCanPath).ref.doc(trashCan.id).update('active', false);
  }

  private getSingle(qFn: QueryFn): Observable<TrashCan> {
    return CommonService.getSingle<TrashCan>(this.afStore, TrashCanPath, qFn);
  }

  private getMultiple(qFn: QueryFn): Observable<TrashCan[]> {
    return CommonService.getMultiple<TrashCan>(this.afStore, TrashCanPath, qFn);
  }
}
