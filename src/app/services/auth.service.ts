import { Injectable } from '@angular/core';
import {AngularFireAuth} from '@angular/fire/auth';
import {Observable, of} from 'rxjs';
import {AngularFirestore} from '@angular/fire/firestore';
import {User} from '../user';
import {switchMap} from 'rxjs/operators';
import * as firebase from 'firebase/app';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private user$: Observable<User>;
  public user: User;

  constructor(private fireAuth: AngularFireAuth,
              private db: AngularFirestore) {

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

  loggedIn(): boolean {
    return !!this.user;
  }
}
