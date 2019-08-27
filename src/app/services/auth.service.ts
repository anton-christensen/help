import {Injectable} from '@angular/core';
import {AngularFireAuth} from '@angular/fire/auth';
import {AngularFirestore} from '@angular/fire/firestore';
import * as firebase from 'firebase/app';
import {Observable, of} from 'rxjs';
import {switchMap} from 'rxjs/operators';
import {User, UserPath} from '../models/user';
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
      .then(credential => {
        // credential.user.email = credential.user.uid;
        return this.createUser(credential.user).then(user => {
          if(!user.email) {
            credential.user.updateEmail(credential.user.uid).then(() => {
              return user;
            });
          }
        });
      });

    firebase.auth().signInWithCustomToken(token).catch(function(error) {
      // Handle Errors here.
      var errorCode = error.code;
      var errorMessage = error.message;
      // ...
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

  private createUser(authData): Promise<User> {
    const user = new User(authData);
    const ref = this.db.firestore.collection(UserPath).doc(authData.uid);

    return ref.get()
      .then(doc => {
        if (!doc.exists) {
          return ref.set(Object.assign({}, user)).catch( reason => console.log(Object.assign({}, user)));
        }
      })
      .then(() => {
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
