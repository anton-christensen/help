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
  styleUrls: ['./ta.component.scss']
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
  }

  public deleteTrashCan(can: TrashCan) {
    this.garbageCollector.deleteTrashCan(can);
  }
}
