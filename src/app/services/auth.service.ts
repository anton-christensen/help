import {DOCUMENT } from '@angular/common';
import {Injectable, Inject} from '@angular/core';
import {AngularFireAuth} from '@angular/fire/auth';
import {AngularFirestore} from '@angular/fire/firestore';
import * as firebase from 'firebase/app';
import {Observable, of} from 'rxjs';
import {switchMap} from 'rxjs/operators';
import {User} from '../models/user';
import {Course} from '../models/course';
import {UserService} from './user.service';
import {ModalService } from './modal.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  public user$: Observable<User>;
  public user: User;
  GDPRMessage = `If you log in with your AAU credentials we will save your email and name in our database.\n
                The information can only be accessed by lecturers and administrators. They use it to identify the correct user to promote to a certain role.\n\n
                If you only wish to use the system as a student there is no reason to log in (but you can still do so, and the same information is stored).\n\n
                Do you accept this?`;

  constructor(@Inject(DOCUMENT) private document: Document,
              private fireAuth: AngularFireAuth,
              private afStore: AngularFirestore,
              private userService: UserService,
              private modalService: ModalService) {

    this.user$ = this.fireAuth.authState.pipe(
      switchMap((authUser) => {
        if (authUser) {
          if (authUser.isAnonymous) {
            return of({
              id: authUser.uid,
              anon: true,
              role: 'student',
            });
          } else {
            return this.userService.getByID(authUser.uid);
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

  public loginAAU() {
    this.modalService.add(this.GDPRMessage, {text: 'No', type: 'negative'}, {text: 'Yes', type: 'positive'}).then((btn) => {
      if (btn.type === 'positive') {
        localStorage.setItem('pre-login-path', this.document.location.pathname);
        this.document.location.href = `https://help.aau.dk/login?target=${this.document.location.origin}`;
      }
    });
  }

  public verifyLoginAAU(token: string) {
    return this.fireAuth.auth.signInWithCustomToken(token)
      .then((credentials: firebase.auth.UserCredential) => {
        return this.userService.createUserWithID(credentials.user.uid, credentials.user.email);
      });
  }

  public loginGoogle(): Promise<User> {
    return this.fireAuth.auth.signInWithPopup(new firebase.auth.GoogleAuthProvider())
      .then((credentials: firebase.auth.UserCredential) => {
        return this.userService.createUserWithID(credentials.user.uid, credentials.user.email);
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
    return this.user && this.user.role === 'TA';
  }

  public isLecturerInCourse(course: Course): boolean {
    return this.user && (this.isLecturer() && course.associatedUserIDs.includes(this.user.id));
  }

  public isAssistantInCourse(course: Course): boolean {
    return this.user && (this.isAssistant() && course.associatedUserIDs.includes(this.user.id));
  }

  public canAssistInCourse(course: Course): boolean {
    return this.user && (this.isAdmin() || this.isAssistantInCourse(course) || this.isLecturerInCourse(course));
  }

  loggedIn(): boolean {
    return this.user && !this.user.anon;
  }

  public anonymousSignIn(): Promise<any> {
    return this.fireAuth.auth.signInAnonymously();
  }
}
