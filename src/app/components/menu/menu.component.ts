import { Component, OnInit } from '@angular/core';
import { Course } from 'src/app/models/course';

import { AuthService } from 'src/app/services/auth.service';

import { AngularFireMessaging } from '@angular/fire/messaging';
import { NotificationService } from 'src/app/services/notification.service';
import { NotificationToken } from 'src/app/models/notification-token';
import { SessionService } from 'src/app/services/session.service';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent implements OnInit {
  public course: Course;
  public open: boolean;
  public notificationToken: NotificationToken;
  public tokenToggleBusy: boolean;

  constructor(public auth: AuthService,
              public session: SessionService,
              private notificationService: NotificationService,
              private afMessaging: AngularFireMessaging) { }

  ngOnInit() {
    // this.afMessaging.messages
    // .subscribe((message) => {
    //   console.log(message);
    // });

    // this.notificationService.getToken(this.course)
    //   .subscribe((token) => {
    //     this.notificationToken = token;
    //   });

    
  }

  public openMenu() {
    this.open = true;
  }
  public closeMenu() {
    this.open = false;
  }

  // public toggleCourseEnabled() {
  //   this.course.enabled = !this.course.enabled;
  //   this.courseService.setCourseEnabled(this.course);
  // }

  // public toggleNotificationsEnabled() {
  //   if (this.notificationToken) {
  //     this.notificationService.deleteToken(this.notificationToken);
  //   } else {
  //     this.tokenToggleBusy = true;
  //     this.notificationService.generateAndSaveToken(this.course)
  //       .then(() => {
  //         this.tokenToggleBusy = false;
  //       });
  //   }
  // }
}