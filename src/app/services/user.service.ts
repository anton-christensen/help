import { Injectable } from '@angular/core';
import { AngularFirestore, QueryFn } from '@angular/fire/firestore';
import { Observable, from, combineLatest } from 'rxjs';
import { User, Role } from '../models/user';
import { CommonService } from './common.service';
import { map, } from 'rxjs/operators';

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

  public setRole(user: User, role: Role) {
    return this.afStore.collection<User>('users').doc(user.id).update({role});
  }

  public getByRole(role: Role): Observable<User[]> {
    return this.getMultiple((ref) => {
      return ref
        .where('role', '==', role);
    });
  }

  private getSingle(qFn: QueryFn): Observable<User> {
    return CommonService.getSingle<User>(this.afStore, 'users', qFn);
  }

  private getMultiple(qFn: QueryFn): Observable<User[]> {
    return CommonService.getMultiple<User>(this.afStore, 'users', qFn);
  }
}
