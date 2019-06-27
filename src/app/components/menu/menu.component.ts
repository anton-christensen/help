import { Component, OnInit, HostListener } from '@angular/core';
import { Course } from 'src/app/models/course';

import { AuthService } from 'src/app/services/auth.service';

import { AngularFireMessaging } from '@angular/fire/messaging';
import { NotificationService } from 'src/app/services/notification.service';
import { NotificationToken } from 'src/app/models/notification-token';
import { SessionService } from 'src/app/services/session.service';
import { CourseService } from 'src/app/services/course.service';
import { Subscription } from 'rxjs';
import { switchMap, map, switchAll } from 'rxjs/operators';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent implements OnInit {
  public course: Course;
  public open: boolean = false;
  public notificationToken: NotificationToken;
  public tokenToggleBusy: boolean = false;
  public isOnAdminPage: boolean = false;
  public isOnCoursePage: boolean = false;
  private notificationSubscription: Subscription = new Subscription();

  constructor(public auth: AuthService,
              public session: SessionService,
              private notificationService: NotificationService,
              private courseService: CourseService,
              private afMessaging: AngularFireMessaging) {
    
    // figure out which page we're on
    session.getRoute().subscribe(route => {
      // TODO: find a better solution instead of these strings
      this.isOnAdminPage = (route == "admin");
      this.isOnCoursePage = (route == "institutes/:institute/courses/:course");
    });

    // get notificationTokens when a course appears
    session.getCourse$().pipe(
      map(course => notificationService.getToken(course)),
      switchAll()
    ).subscribe(token => {
      this.notificationToken = token;
    });
  }

  ngOnInit() {
    // open menu by default if window is wide
    if(window.innerWidth >= 1300) {
      this.open = true;
    }

    this.afMessaging.messages
    .subscribe((message) => {
      console.log("Notification: ", message);
    });
  }

  public openMenu() {
    this.open = true;
  }
  public closeMenu() {
    this.open = false;
  }

  public toggleCourseEnabled(course: Course) {
    course.enabled = !course.enabled;
    this.courseService.setCourseEnabled(course);
  }

  public toggleNotificationsEnabled(course: Course) {
    if(this.tokenToggleBusy)
      return;
    
    if (this.notificationToken) {
      this.notificationService.deleteToken(this.notificationToken);
    } else {
      this.tokenToggleBusy = true;
      this.notificationService.generateAndSaveToken(course)
        .then(() => {
          this.tokenToggleBusy = false;
        });
    }
  }
}