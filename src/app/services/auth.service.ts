import {Injectable} from '@angular/core';
import {AngularFireAuth} from '@angular/fire/auth';
import {AngularFirestore} from '@angular/fire/firestore';
import * as firebase from 'firebase/app';
import {Observable, of} from 'rxjs';
import {switchMap} from 'rxjs/operators';
import {Role, User, UserPath} from '../models/user';
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
            return of({
              uid: authUser.uid,
              anon: true,
              role: 'student',
            });
          } else {
            return this.db.doc<User>(`${UserPath}/${authUser.uid}`).valueChanges();
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

  public loginAAU(token: string) {
    return this.fireAuth.auth.signInWithCustomToken(token)
      .then((credentials: firebase.auth.UserCredential) => {
        return this.createOrUpdateUser(credentials);
      });
  }

  public loginGoogle(): Promise<User> {
    return this.fireAuth.auth.signInWithPopup(new firebase.auth.GoogleAuthProvider())
      .then((credentials: firebase.auth.UserCredential) => {
        return this.createOrUpdateUser(credentials);
      });
  }

  public logout(): Promise<void> {
    return this.fireAuth.auth.signOut();
  }

  public isPromotedUser(): boolean {
    return this.isAdmin() || this.isLecturer() || this.isAssistant();
  }

  public isAdmin(): boolean {
    return this.user && this.user.role === 'admin';
  }

  public isLecturer(): boolean {
    return this.user && this.user.role === 'lecturer';
  }

  public isAssistant(): boolean {
    return this.user && this.user.role === 'assistant';
  }

  public isLecturerInCourse(course: Course): boolean {
    return this.user && (this.isLecturer() && course.associatedUserIDs.includes(this.user.uid));
  }

  public isAssistantInCourse(course: Course): boolean {
    return this.user && (this.isAssistant() && course.associatedUserIDs.includes(this.user.uid));
  }

  public canAssistInCourse(course: Course): boolean {
    return this.user && (this.isAdmin() || this.isAssistantInCourse(course) || this.isLecturerInCourse(course));
  }

  private createOrUpdateUser(credentials: firebase.auth.UserCredential): Promise<User> {
    const user = {
      email: credentials.user.uid,
      anon: false,
      name: '',
      role: 'student',
    } as User;
    const ref = this.db.firestore.collection(UserPath).doc(credentials.user.uid);

    return ref.get()
      .then((doc) => {
        if (!doc.exists) {
          return ref.set(user);
        }
      })
      .catch((err) => {
        console.error('Error saving user:', err);
      })
      .then(() => {
        user.uid = credentials.user.uid;
        return user;
      });
  }

  loggedIn(): boolean {
    return this.user && !this.user.anon;
  }

  public anonymousSignIn(): Promise<any> {
    return this.fireAuth.auth.signInAnonymously();
  }
}
