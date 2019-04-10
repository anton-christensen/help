import { Component, OnInit, Input } from '@angular/core';
import {AuthService} from '../../services/auth.service';
import { AngularFireMessaging } from '@angular/fire/messaging';
import { TrashCanService } from 'src/app/services/trash-can.service';
import { Observable } from 'rxjs';
import { TrashCan } from 'src/app/models/trash-can';
import { CommonService } from 'src/app/services/common.service';
import { Course } from 'src/app/models/course';
import { CourseService } from 'src/app/services/course.service';
import { NotificationService } from 'src/app/services/notification.service';
import { NotificationToken } from 'src/app/models/notification-token';

@Component({
  selector: 'app-ta',
  templateUrl: './ta.component.html',
  styles: []
})
export class TaComponent implements OnInit {
  @Input() public course: Course;
  trashCans$: Observable<TrashCan[]>;
  public notificationToken: NotificationToken;

  constructor(public auth: AuthService,
              private notificationService: NotificationService,
              private afMessaging: AngularFireMessaging,
              private garbageCollector: TrashCanService,
              private courseService: CourseService,
              public common: CommonService) {}

  ngOnInit() {
    this.trashCans$ = this.garbageCollector.getTrashCans(this.course.slug);

    this.afMessaging.messages
    .subscribe((message) => {
      console.log(message);
    });

    this.notificationService.getToken(this.course)
      .subscribe((token) => {
        this.notificationToken = token;
      });
  }

  public deleteTrashCan(can: TrashCan) {
    this.garbageCollector.deleteTrashCan(can);
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
