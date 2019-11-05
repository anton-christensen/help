import {Component, Inject, OnInit} from '@angular/core';
import {ToastService} from '../../services/toasts.service';
import {first, switchMap, tap} from 'rxjs/operators';
import {CourseService} from '../../services/course.service';
import {Router} from '@angular/router';
import {CommonService} from '../../services/common.service';
import {NotificationService} from '../../services/notification.service';
import {Observable} from 'rxjs';
import {SessionService} from '../../services/session.service';
import {AuthService} from '../../services/auth.service';
import {DOCUMENT} from '@angular/common';
import {NotificationToken} from '../../models/notification-token';
import {Course} from '../../models/course';
import {AngularFireMessaging} from '@angular/fire/messaging';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent implements OnInit {
  public isOpen = false;
  public notificationToken$: Observable<NotificationToken>;
  public tokenToggleBusy = true;

  constructor(@Inject(DOCUMENT) private document: Document,
              public auth: AuthService,
              public sessionService: SessionService,
              public commonService: CommonService,
              private afMessaging: AngularFireMessaging,
              private router: Router,
              private courseService: CourseService,
              private notificationService: NotificationService,
              private toastService: ToastService) {
    // Get notificationToken when a course appears
    this.notificationToken$ = this.sessionService.getCourse$().pipe(
      switchMap((course: Course) => {
        return notificationService.getToken(course).pipe(
          tap(() => this.tokenToggleBusy = false)
        );
      }
    ));
  }

  ngOnInit() {
    this.afMessaging.messages
      .subscribe((message) => {
        console.log('Notification: ', message);
      });
  }

  public openMenu() {
    this.isOpen = true;
  }
  public closeMenu() {
    this.isOpen = false;
  }

  public toggleCourseEnabled(course: Course) {
    const newStatus = !course.enabled;

    this.courseService.setEnabled(course, newStatus).pipe(first()).subscribe();
  }

  public toggleNotificationsEnabled(course: Course, token: NotificationToken | null = null) {
    if (this.tokenToggleBusy) {
      return;
    }

    this.tokenToggleBusy = true;

    if (token) {
      this.notificationService.deleteToken(token).pipe(first())
        .subscribe(() => {
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

  public isPWA(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches;
  }

  public adminClicked() {
    localStorage.setItem('preAdminLocation', this.document.location.pathname);
    this.closeMenu();
  }

  public back() {
    const current = this.commonService.currentLocation;

    if (current === 'admin') {
      const path = localStorage.getItem('preAdminLocation');
      localStorage.removeItem('preAdminLocation');
      this.router.navigateByUrl(path || '/');
    } else if (current === 'courseList') {
      this.router.navigateByUrl('/');
    } else {
      const departmentSlug = /\/([^\/]+)/.exec(this.document.location.pathname)[1];
      this.router.navigateByUrl(departmentSlug);
    }
  }

  public menuClicked() {
    this.closeMenu();
  }
}
