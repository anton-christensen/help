import { Component, OnInit, Input } from '@angular/core';
import { Course } from 'src/app/models/course';

import { AuthService } from 'src/app/services/auth.service';
import { CourseService } from 'src/app/services/course.service';

import { AngularFireMessaging } from '@angular/fire/messaging';
import { NotificationService } from 'src/app/services/notification.service';
import { NotificationToken } from 'src/app/models/notification-token';

@Component({
  selector: 'app-course-burger-bar',
  templateUrl: './course-burger-bar.component.html',
  styleUrls: ['./course-burger-bar.component.scss']
})
export class CourseBurgerBarComponent implements OnInit {
  @Input() public course: Course;
  public open: boolean;
  public notificationToken: NotificationToken;

  constructor(public auth: AuthService,
              private courseService: CourseService,
              private notificationService: NotificationService,
              private afMessaging: AngularFireMessaging) { }

  ngOnInit() {
    this.afMessaging.messages
    .subscribe((message) => {
      console.log(message);
    });

    this.notificationService.getToken(this.course)
      .subscribe((token) => {
        this.notificationToken = token;
      });
  }

  public openMenu() {
    this.open = true;
  }
  public closeMenu() {
    this.open = false;
  }

  public toggleCourseEnabled() {
    this.course.enabled = !this.course.enabled;
    this.courseService.setCourseEnabled(this.course);
  }

  public toggleNotificationsEnabled() {
    if(this.notificationToken) {
      console.log(this.notificationToken);
      this.notificationService.deleteToken(this.notificationToken);
    }
    else {
      this.notificationService.generateAndSaveToken(this.course)
        .then(() => {
          console.log('you added it succesfully, congratulatinos');
        });
    }
  }
}
