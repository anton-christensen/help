import { Component, OnInit, Input } from '@angular/core';
import {AuthService} from '../../services/auth.service';
import { AngularFireMessaging } from '@angular/fire/messaging';
import { TrashCanService } from 'src/app/services/trash-can.service';
import { Observable } from 'rxjs';
import { TrashCan } from 'src/app/models/trash-can';
import { CommonService } from 'src/app/services/common.service';
import { Course } from 'src/app/models/course';
import { CourseService } from 'src/app/services/course.service';
import {ToastService} from '../../services/toasts.service';
import {tap} from 'rxjs/operators';

@Component({
  selector: 'app-ta',
  templateUrl: './ta.component.html',
  styles: []
})
export class TaComponent implements OnInit {
  @Input() public course: Course;
  trashCans$: Observable<TrashCan[]>;

  constructor(public auth: AuthService,
              private toastService: ToastService,
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
  }

  public deleteTrashCan(can: TrashCan) {
    this.garbageCollector.deleteTrashCan(can);
  }

  public toggleCourseEnabled() {
    this.course.enabled = !this.course.enabled;
    this.courseService.setCourseEnabled(this.course);
  }

  public requestNotificationToken() {
    this.afMessaging.requestToken
      .subscribe((token) => {
        this.auth.addNotificationToken(this.course, token)
          .then((tokenExisted) => {
            if (!tokenExisted) {
              this.toastService.add('You will now receive notifications from this course');
            }
          });
      });
  }

  public hasNotificationToken(): Observable<string> {
    return this.afMessaging.getToken;
  }

  public deleteNotificationToken() {
    this.afMessaging.getToken
      .subscribe((token) => {
        this.afMessaging.deleteToken(token);
      })
      .unsubscribe();
  }
}
