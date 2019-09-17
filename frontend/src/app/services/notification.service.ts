import {Injectable} from '@angular/core';
import {AngularFireMessaging} from '@angular/fire/messaging';
import {AngularFirestore, QueryFn} from '@angular/fire/firestore';
import {Course} from '../models/course';
import {AuthService} from './auth.service';
import {NotificationToken, NotificationTokenPath} from '../models/notification-token';
import * as Fingerprint from 'fingerprintjs2';

import {Observable} from 'rxjs';
import {map, mergeMap, switchMap, first} from 'rxjs/operators';
import {CommonService} from './common.service';


@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  public fingerprint$: Observable<string>;
  private fingerprint: string;

  constructor(private afStore: AngularFirestore,
              private afMessaging: AngularFireMessaging,
              private auth: AuthService) {
    this.fingerprint$ = new Observable<string>((observer) => {
      if (this.fingerprint === undefined) {
        setTimeout(() => {
          const options = {};
          Fingerprint.get(options, (components) => {
            const values = components.map((component) => component.value);
            this.fingerprint = Fingerprint.x64hash128(values.join(''), 31);
            observer.next(this.fingerprint);
          });
        }, 500);
      } else {
        observer.next(this.fingerprint);
      }
    });
  }

  public generateAndSaveToken(course: Course): Promise<any> {
    return new Promise((resolve) => {
      // get device fingerprint
      this.fingerprint$.pipe(first())
        .subscribe((fingerprint) => {
          // Request a new token
          this.afMessaging.requestToken
            .subscribe((token) => {
              // resolve() when done
              const ref = this.afStore.collection<NotificationToken>(NotificationTokenPath, (ref2) => {
                return ref2
                .where('userID', '==', this.auth.user.id)
                .where('deviceID', '==', fingerprint)
                .where('courseID', '==', course.id)
                .limit(1);
              });

              ref.get().toPromise()
                .then((snapshot) => {
                  if (snapshot.docs.length === 0) {
                    // Create a new token
                    const id = this.afStore.collection<NotificationToken>(NotificationTokenPath).ref.doc().id;
                    const doc = {
                      token,
                      deviceID: fingerprint,
                      userID: this.auth.user.id,
                      courseID: course.id
                    };

                    return this.afStore.collection<NotificationToken>(NotificationTokenPath).doc(id).set(doc);
                  } else {
                    // Update the token
                    return snapshot.docs[0].ref.update({token});
                  }
                })
                .then(() => {
                  resolve(token);
                }) ;
            });
        });
    });
  }

  public getToken(course: Course): Observable<NotificationToken> {
    return this.fingerprint$.pipe(
      switchMap((fingerprint) => {
        return this.auth.user$.pipe(
          switchMap((user) => {
            return this.getSingle((ref) => {
              return ref
              .where('userID', '==', user ? user.id : '')
              .where('deviceID', '==', fingerprint)
              .where('courseID', '==', course.id);
            });
          })
        );
      })
    );
  }

  public deleteToken(token: NotificationToken): Promise<any> {
    this.afMessaging.deleteToken(token.token);

    return this.afStore.collection<NotificationToken>(NotificationTokenPath).doc(token.id).delete();
  }

  private getSingle(qFn: QueryFn): Observable<NotificationToken> {
    return CommonService.getSingle<NotificationToken>(this.afStore, NotificationTokenPath, qFn);
  }

  private getMultiple(qFn: QueryFn): Observable<NotificationToken[]> {
    return CommonService.getMultiple<NotificationToken>(this.afStore, NotificationTokenPath, qFn);
  }
}
