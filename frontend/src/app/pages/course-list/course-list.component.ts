import {Component, OnInit} from '@angular/core';
import {CourseService, CoursePager} from 'src/app/services/course.service';
import {AuthService} from '../../services/auth.service';
import {SessionService} from '../../services/session.service';
import {CommonService} from '../../services/common.service';
import {Observable} from 'rxjs';
import {Course} from '../../models/course';

@Component({
  selector: 'app-course-list',
  templateUrl: './course-list.component.html',
  styleUrls: ['./course-list.component.scss']
})
export class CourseListComponent implements OnInit {
  public courses$: Observable<Course[]>;

  constructor(public auth: AuthService,
              private commonService: CommonService,
              private session: SessionService,
              private courseService: CourseService) {}


  ngOnInit() {
    this.commonService.currentLocation = 'courseList';

    this.session.getDepartment()
      .subscribe((department) => {
        this.commonService.setTitle(`Courses at ${department.slug.toUpperCase()}`);

        this.courses$ = this.courseService.getRelevantByDepartment(department.slug);
    });
  }
}
