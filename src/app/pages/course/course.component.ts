import {Component, OnInit} from '@angular/core';
import {AuthService} from 'src/app/services/auth.service';
import {Course} from 'src/app/models/course';
import {SessionService} from '../../services/session.service';
import {Observable} from 'rxjs';
import {CommonService} from '../../services/common.service';

@Component({
  selector: 'app-course',
  templateUrl: './course.component.html',
  styleUrls: ['./course.component.scss']
})
export class CourseComponent implements OnInit {
  public course$: Observable<Course>;

  constructor(public auth: AuthService,
              private commonService: CommonService,
              private sessionService: SessionService) { }

  ngOnInit() {
    this.commonService.currentLocation = 'course';

    this.course$ = this.sessionService.getCourse$();
  }

}
