import { Injectable } from '@angular/core';
import {AngularFireAuth} from '@angular/fire/auth';
import {Observable, of} from 'rxjs';
import {AngularFirestore} from '@angular/fire/firestore';
import {switchMap} from 'rxjs/operators';
import * as firebase from 'firebase/app';
import {AngularFireMessaging} from '@angular/fire/messaging';
import { User } from '../models/user';
import { Course } from '../models/course';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  public user$: Observable<User>;
  public user: User;

  constructor(private fireAuth: AngularFireAuth,
              private db: AngularFirestore,
              private afMessaging: AngularFireMessaging) {

    this.user$ = this.fireAuth.authState.pipe(
      switchMap((authUser) => {
        if (authUser) {
          return this.db.doc<User>(`users/${authUser.uid}`).valueChanges();
        } else {
          return of(null);
        }
      })
    );

    this.user$
      .subscribe((user) => {
        this.user = user;
      });
  }

  public login(): Promise<User> {
    return this.fireAuth.auth.signInWithPopup(new firebase.auth.GoogleAuthProvider())
      .then(credential => {
        return this.createUser(credential.user);
      });
  }

  public logout() {
    this.fireAuth.auth.signOut();
  }

  public isAdmin(): boolean {
    return this.user && this.user.admin;
  }

  public isTA(course: Course): boolean {
    return this.user && (this.user.admin || this.user.courses.includes(course.slug));
  }

  private createUser(authData): Promise<any> {
    let userData;
    const ref = this.db.firestore.collection('users').doc(authData.uid);

    return ref.get()
      .then(doc => {
        if (!doc.exists) {
          userData = Object.assign({}, new User(authData));
          ref.set(userData);
        }
      })
      .then(() => {
        return userData;
      });
  }

  public addMessagingToken(token: string): Promise<any> {
    const ref = this.db.firestore.collection('users').doc(this.user.uid);

    return ref.get()
      .then((doc) => {
        if (doc.exists) {
          ref.update('messagingTokens', firebase.firestore.FieldValue.arrayUnion(token));
        }
      });
  }

  loggedIn(): boolean {
    return !!this.user;
  }

  public isActualCourse(courseSlug: string): Promise<boolean> {
    return this.db.collection<Course>('courses', ref => ref.where('slug', '==', courseSlug)).get().toPromise()
      .then(val => !val.empty);
  }
}
