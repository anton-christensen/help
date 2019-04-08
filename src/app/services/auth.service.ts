import {Injectable} from '@angular/core';
import {AngularFireAuth} from '@angular/fire/auth';
import {AngularFirestore, DocumentSnapshot} from '@angular/fire/firestore';
import {AngularFireMessaging} from '@angular/fire/messaging';
import * as firebase from 'firebase/app';
import {Observable, of} from 'rxjs';
import {switchMap} from 'rxjs/operators';
import {User} from '../models/user';
import {Course} from '../models/course';

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

  public logout(): Promise<void> {
    return this.fireAuth.auth.signOut();
  }

  public isAdmin(): boolean {
    return this.user && this.user.admin;
  }

  public isTA(): boolean {
    return this.user && (this.user.admin || this.user.courses.length > 0);
  }

  public isTAInCourse(course: Course): boolean {
    return this.user && (this.user.admin || this.user.courses.includes(course.slug));
  }

  private createUser(authData): Promise<User> {
    const user = new User(authData);
    const ref = this.db.firestore.collection('users').doc(authData.uid);

    return ref.get()
      .then(doc => {
        if (!doc.exists) {
          return ref.set(Object.assign({}, user));
        }
      })
      .then(() => {
        return user;
      });
  }

  loggedIn(): boolean {
    return !!this.user;
  }

  public isActualCourse(courseSlug: string): Promise<boolean> {
    return this.db.collection<Course>('courses', ref => ref.where('slug', '==', courseSlug)).get().toPromise()
      .then((val) => {
        return !val.empty;
      });
  }
}
