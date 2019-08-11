import { Injectable } from '@angular/core';
import { AngularFireMessaging } from '@angular/fire/messaging';
import { AngularFirestore } from '@angular/fire/firestore';
import { Course } from '../models/course';
import { AuthService } from './auth.service';
import { NotificationToken } from '../models/notification-token';
import 'clientjs';
import { Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  // @ts-ignore
  private clientJS = new ClientJS();


  constructor(private db: AngularFirestore,
              private afMessaging: AngularFireMessaging,
              private auth: AuthService) {
              }
  
  public generateAndSaveToken(course: Course): Promise<any> {
    return new Promise((resolve) => {
      // Request a new token
      this.afMessaging.requestToken
      .subscribe((token) => {
        // Delete old tokens
        this.db.collection<NotificationToken>('notificationTokens', ref => {
          return ref.where('deviceId', '==', this.clientJS.getFingerprint())
          .where('courseId', '==', course.id)
        }).get().toPromise()
          .then((val) => {
            val.forEach((res) => {
              res.ref.delete();
            });
      
          // Then insert the new token
          const id = this.db.collection<NotificationToken>('notificationTokens').ref.doc().id;
          const doc = new NotificationToken(id, token, this.clientJS.getFingerprint(), this.auth.user, course)
          this.db.collection<NotificationToken>('notificationTokens').doc(id).set(Object.assign({}, doc))
            .then(() => resolve());
        });
      });
    })
  }

  public getToken(course: Course): Observable<NotificationToken> {
    const fingerprint = this.clientJS.getFingerprint();
    return this.db.collection<NotificationToken>('notificationTokens', ref => {
      return ref.where('deviceId', '==', fingerprint)
      .where('courseId', '==', course.id)
      .limit(1);
    }).snapshotChanges().pipe(
      map(actions => {
        return actions.map(a => {
            const data = a.payload.doc.data() as any;
            const id = a.payload.doc.id;
            return {id, ...data};
        });
      }),
      mergeMap((result) => {
          return result.length ? result : [null];
      })
    );
  }
  
  public deleteToken(token: NotificationToken): Promise<any> {
    console.log(token.token);
    this.afMessaging.deleteToken(token.token);

    return this.db.collection<NotificationToken>('notificationTokens').doc(token.id).delete();
  }
}
