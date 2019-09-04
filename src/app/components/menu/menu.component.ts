import {Component, OnInit, OnDestroy, Inject, ViewChild, ElementRef} from '@angular/core';
import { Course } from 'src/app/models/course';

import { AuthService } from 'src/app/services/auth.service';

import { AngularFireMessaging } from '@angular/fire/messaging';
import { NotificationService } from 'src/app/services/notification.service';
import { NotificationToken } from 'src/app/models/notification-token';
import { SessionService } from 'src/app/services/session.service';
import { CourseService } from 'src/app/services/course.service';
import { Subscription, Observable } from 'rxjs';
import {switchMap} from 'rxjs/operators';
import {ToastService} from '../../services/toasts.service';
import {Router} from '@angular/router';
import {DOCUMENT} from "@angular/common";

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent implements OnInit, OnDestroy {
  public open = false;
  public notificationToken$: Observable<NotificationToken>;
  private notificationTokenSub: Subscription;
  public notificationToken: NotificationToken;
  public tokenToggleBusy = false;

  constructor(@Inject(DOCUMENT) private document: Document,
              public auth: AuthService,
              public sessionService: SessionService,
              private afMessaging: AngularFireMessaging,
              private router: Router,
              private courseService: CourseService,
              private notificationService: NotificationService,
              private toastService: ToastService) {

    // Get notificationToken when a course appears
    this.notificationToken$ = this.sessionService.getCourse$().pipe(
      switchMap((course: Course) => {
        return notificationService.getToken(course);
      }
    ));

    this.notificationTokenSub = this.notificationToken$
      .subscribe((token) => {
        this.notificationToken = token;
      });
  }

  ngOnInit() {
    this.afMessaging.messages
      .subscribe((message) => {
        console.log('Notification: ', message);
      });
  }

  ngOnDestroy() {
    this.notificationTokenSub.unsubscribe();
  }

  public openMenu() {
    this.open = true;
  }
  public closeMenu() {
    this.open = false;
  }

  public toggleCourseEnabled(course: Course): Promise<void> {
    course.enabled = !course.enabled;
    return this.courseService.setCourseEnabled(course);
  }

  public toggleNotificationsEnabled(course: Course) {
    if (this.tokenToggleBusy) {
      return;
    }

    this.tokenToggleBusy = true;

    if (this.notificationToken) {
      this.notificationService.deleteToken(this.notificationToken)
        .then(() => {
          this.tokenToggleBusy = false;
        });
    } else {
      this.notificationService.generateAndSaveToken(course)
        .then(() => {
          this.tokenToggleBusy = false;
        });
    }
  }

  public reportBugClicked() {
    this.toastService.add('Opening your email client...');
  }

  clicked($event: MouseEvent) {

  }
}
