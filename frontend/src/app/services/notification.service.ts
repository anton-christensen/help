import {Injectable} from "@angular/core";
import {Observable} from "rxjs";
import {RequestCache} from "../utils/request-cache";
import {NotificationToken} from "../models/notification-token";
import {environment} from "../../environments/environment";
import {first, shareReplay, switchMap} from "rxjs/operators";
import {HttpClient} from "@angular/common/http";
import {AngularFireMessaging} from "@angular/fire/messaging";
import {AuthService} from "./auth.service";
import {Course} from "../models/course";
import * as Fingerprint from 'fingerprintjs2';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  public fingerprint$: Observable<string>;
  private fingerprint: string;

  private readonly byCourse = new RequestCache<{departmentSlug: string, courseSlug: string}, NotificationToken>(({departmentSlug, courseSlug}) => {
    return this.http.get<NotificationToken>(`${environment.api}/departments/${departmentSlug}/courses/${courseSlug}/trashcans/notificationtokens`).pipe(
      shareReplay(1)
    );
  });

  constructor(private http: HttpClient,
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
              this.http.post<NotificationToken>(`${environment.api}/departments/${course.departmentSlug}/courses/${course.slug}/trashcans/notificationtokens`, {
                token,
                deviceID: fingerprint
              }).pipe(first()).subscribe(() => resolve(token));
            });
        });
    });
  }

  public getToken(course: Course): Observable<NotificationToken> {
    return this.fingerprint$.pipe(
      switchMap(() => {
        return this.auth.user$.pipe(
          switchMap(() => {
            return this.byCourse.getObservable({departmentSlug: course.departmentSlug, courseSlug: course.slug});
          })
        );
      })
    );
  }

  public deleteToken(token: NotificationToken): Observable<any> {
    this.afMessaging.deleteToken(token.token);
    return this.http.delete<NotificationToken>(`${environment.api}/departments/${token.departmentSlug}/courses/${token.courseSlug}/trashcans/notificationtokens`);
  }
}
