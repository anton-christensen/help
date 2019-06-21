import {Injectable} from '@angular/core';
import {AngularFireAuth} from '@angular/fire/auth';
import {AngularFirestore} from '@angular/fire/firestore';
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
              private db: AngularFirestore) {

    this.user$ = this.fireAuth.authState.pipe(
      switchMap((authUser) => {
        if (authUser) {
          if (authUser.isAnonymous) {
            return of(new User(authUser));
          } else {
            return this.db.doc<User>(`users/${authUser.uid}`).valueChanges();
          }
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
    return this.user && this.user.role == 'admin';
  }

  public isLecturer(): boolean {
    return this.isAdmin() || this.user && this.user.role == 'lecturer';
  }

  public isTA(): boolean {
    return this.isAdmin() || this.user && this.user.role == 'ta';
  }

  public isTAInCourse(course: Course): boolean {
    return this.user && (this.isLecturer() || course.binMen.includes(this.user.uid));;
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
    return this.user && !this.user.anon;
  }

  public isActualCourse(courseSlug: string): Promise<boolean> {
    return this.db.collection<Course>('courses', ref => ref.where('slug', '==', courseSlug)).get().toPromise()
      .then((val) => {
        return !val.empty;
      });
  }

  public anonymousSignIn(): Promise<any> {
    return this.fireAuth.auth.signInAnonymously();
  }
}
