import { Injectable } from '@angular/core';
import { AngularFirestore, QueryFn } from '@angular/fire/firestore';
import { Observable, combineLatest } from 'rxjs';
import {User, Role, UserPath} from '../models/user';
import { CommonService } from './common.service';
import {map} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private afStore: AngularFirestore) {}

  public getAll(): Observable<User[]> {
    return this.getMultiple((ref) => {
      return ref
        .orderBy('email', 'asc');
    });
  }

  public getByID(userID: string): Observable<User> {
    return this.afStore.doc<User>(`${UserPath}/${userID}`).snapshotChanges().pipe(
      map((action) => {
        const data = action.payload.data() as any;
        const id = action.payload.id;
        return {id, ...data};
      })
    );
  }

  public getAllByID(associatedUserIDs: string[]): Observable<User[]> {
    const observables = [] as Observable<User>[];
    for (const id of associatedUserIDs) {
      observables.push(this.getByID(id));
    }

    return combineLatest(observables);
  }

  public getByEmail(email: string): Observable<User> {
    return this.getSingle((ref) => {
      return ref
        .where('email', '==', email);
    });
  }

  // public getByRole(role: Role): Observable<User[]> {
  //   return this.getMultiple((ref) => {
  //     return ref
  //       .where('role', '==', role);
  //   });
  // }

  public createUserWithEmail(email: string): Promise<User> {
    const id = this.afStore.collection<User>(UserPath).ref.doc().id;
    return this.createOrGetUserWithID(id, email);
  }

  public createOrGetUserWithID(id: string, email: string): Promise<User> {
    const user = {
      email,
      anon: false,
      name: '',
      role: 'student',
    } as User;
    const ref = this.afStore.firestore.collection(UserPath).doc(id);

    return ref.get()
      .then((doc) => {
        if (!doc.exists) {
          return ref.set(user);
        } else {
          const data = doc.data() as any;
          return {id, ...data};
        }
      })
      .catch((err) => {
        console.error('Error saving user:', err);
      })
      .then((existingUser) => {
        if (existingUser) {
          return existingUser;
        } else {
          user.id = id;
          return user;
        }
      });
  }

  public setRole(user: User, role: Role) {
    return this.afStore.collection<User>('users').doc(user.id).update({role});
  }

  private getSingle(qFn: QueryFn): Observable<User> {
    return CommonService.getSingle<User>(this.afStore, 'users', qFn);
  }

  private getMultiple(qFn: QueryFn): Observable<User[]> {
    return CommonService.getMultiple<User>(this.afStore, 'users', qFn);
  }
}
