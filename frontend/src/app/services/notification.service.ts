import {Injectable} from '@angular/core';
import {Observable, of} from 'rxjs';
import {RequestCache} from '../utils/request-cache';
import {NotificationToken} from '../models/notification-token';
import {environment} from '../../environments/environment';
import {first, map, shareReplay, switchMap} from 'rxjs/operators';
import {HttpClient} from '@angular/common/http';
import {AngularFireMessaging} from '@angular/fire/messaging';
import {Course} from '../models/course';
import * as Fingerprint from 'fingerprintjs2';
import {getSingleStreamObservable} from '../utils/stream-http';
import {APIResponse, responseAdapter} from '../models/api-response';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  public fingerprint$: Observable<string>;
  private fingerprint: string;

  private readonly byCourse =
    new RequestCache<{departmentSlug: string, courseSlug: string, fingerprint: string}, NotificationToken>(
      ({departmentSlug, courseSlug, fingerprint}) => {
        return getSingleStreamObservable<NotificationToken>(
          `${environment.api}/departments/${departmentSlug}/courses/${courseSlug}/trashcans/notificationtokens/${fingerprint}`
        );
  }, -1);

  constructor(private http: HttpClient,
              private afMessaging: AngularFireMessaging) {
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
    }).pipe(shareReplay(1));
  }

  public generateAndSaveToken(course: Course): Promise<any> {
    return new Promise((resolve) => {
      // get device fingerprint
      this.fingerprint$.pipe(first())
        .subscribe((fingerprint) => {
          // Request a new token
          this.afMessaging.requestToken
            .subscribe((token) => {
              this.http.post<APIResponse<NotificationToken>>(
                `${environment.api}/departments/${course.departmentSlug}/courses/${course.slug}/trashcans/notificationtokens`, {
                token,
                deviceID: fingerprint
              }).pipe(first())
                .subscribe(() => resolve(token));
            });
        });
    });
  }

  public getToken(course: Course): Observable<NotificationToken> {
    if (!course) {
      return of(null);
    }

    return this.fingerprint$.pipe(
      switchMap((fingerprint) => {
        return this.byCourse.getObservable({departmentSlug: course.departmentSlug, courseSlug: course.slug, fingerprint});
      })
    );
  }

  public deleteToken(token: NotificationToken): Observable<any> {
    this.afMessaging.deleteToken(token.token);
    return this.http.delete<APIResponse<NotificationToken>>(
      `${environment.api}/departments/${token.departmentSlug}/courses/${token.courseSlug}/trashcans/notificationtokens/${token.deviceID}`
    ).pipe(
      map((response) => responseAdapter<NotificationToken>(response)),
    );
  }
}
