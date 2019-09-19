import {DOCUMENT } from '@angular/common';
import {Injectable, Inject} from '@angular/core';
import {AngularFireAuth} from '@angular/fire/auth';
import {AngularFirestore} from '@angular/fire/firestore';
import * as firebase from 'firebase/app';
import {BehaviorSubject, Observable, of, ReplaySubject, Subject} from 'rxjs';
import {first, switchMap, tap} from 'rxjs/operators';
import {Role, User} from '../models/user';
import {Course} from '../models/course';
import {UserService} from './user.service';
import {ModalService } from './modal.service';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../environments/environment';
import {ToastService} from './toasts.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  public user$: BehaviorSubject<User> = new BehaviorSubject<User>({
    id: '',
    email: '',
    anon: true,
    name: '',
    role: 'student'
  });

  // public user: User;

  private casUrl = 'https://login.aau.dk/cas';
  private apiLoginUrl = `${environment.api}/user/_auth`;
  private GDPRMessage = `If you log in with your AAU credentials we will save your email and name in our database.\n
                The information can only be accessed by lecturers and administrators.
                They use it to identify the correct user to promote to a certain role.\n\n
                If you only wish to use the system as a student there is no reason to log in, but if you do so
                your information will also be stored and requests for help are associated with it.\n\n
                Do you accept this?`;

  constructor(@Inject(DOCUMENT) private document: Document,
              private fireAuth: AngularFireAuth,
              private afStore: AngularFirestore,
              private http: HttpClient,
              private userService: UserService,
              private modalService: ModalService) {

    this.getUser().subscribe((user) => this.user$.next(user));

    this.user$
      .subscribe((user) => {
        console.log(user);
      })
  }

  public previouslyAcceptedLogInConditions(): boolean {
    return !!localStorage.getItem('acceptedLogInConditions');
  }

  public showLogInConditionsAndRedirect() {
    this.modalService.add(
      this.GDPRMessage,
      {text: 'Yes', type: 'positive'},
      {text: 'No', type: 'negative'})
      .then((btn) => {
        if (btn.type === 'positive') {
          localStorage.setItem('acceptedLogInConditions', 'true');
          this.redirectToAAU();
        }
      })
      .catch(() => {});
  }

  public getLoginURL(): string {
    const returnTargetUrl = `${this.document.location.origin}/auth`;
    const service = encodeURI(`${this.apiLoginUrl}?target=${returnTargetUrl}`);

    return encodeURI(`${this.casUrl}/login?service=${service}`);
  }

  public saveCurrentPath() {
    localStorage.setItem('preLoginPath', this.document.location.pathname);
  }

  private redirectToAAU() {
    this.saveCurrentPath();

    this.document.location.href = this.getLoginURL();
  }

  public getUser(): Observable<User> {
    return this.http.get<User>(`${environment.api}/user`);
  }

  public logout() {
    localStorage.removeItem('token');
    this.getUser().subscribe();
  }

  public isAdmin(): Observable<boolean> {
    return this.user$.pipe(
      switchMap((user) => of(user && user.role === 'admin'))
    );
  }

  public isLecturer(): Observable<boolean> {
    return this.user$.pipe(
      switchMap((user) => of(user && user.role === 'lecturer'))
    );
  }

  public isAssistant(): Observable<boolean> {
    return this.user$.pipe(
      switchMap((user) => of(user && user.role === 'TA'))
    );
  }

  public isLecturerInCourse(course: Course): Observable<boolean> {
    return this.user$.pipe(
      switchMap((user) => of(user && user.role === 'lecturer' && course.associatedUserIDs.includes(user.id)))
    );
  }

  public isAssistantInCourse(course: Course): Observable<boolean> {
    return this.user$.pipe(
      switchMap((user) => of(user && user.role === 'TA' && course.associatedUserIDs.includes(user.id)))
    );
  }

  public canAssistInCourse(course: Course): Observable<boolean> {
    return this.user$.pipe(
      switchMap((user) => of(user && (user.role === 'lecturer' || user.role === 'TA') && course.associatedUserIDs.includes(user.id)))
    );
  }

  public loggedIn(): Observable<boolean> {
    return this.user$.pipe(
      switchMap((user) => of(user && !user.anon))
    );
  }
}
