import {Component, OnInit} from '@angular/core';
import {CourseService, CoursePager} from 'src/app/services/course.service';
import {AuthService} from '../../services/auth.service';
import {SessionService} from '../../services/session.service';
import {CommonService} from '../../services/common.service';

@Component({
  selector: 'app-course-list',
  templateUrl: './course-list.component.html',
  styleUrls: ['./course-list.component.scss']
})
export class CourseListComponent implements OnInit {
  public coursePager: CoursePager;

  constructor(public auth: AuthService,
              private commonService: CommonService,
              private session: SessionService,
              private courseService: CourseService) {}


  ngOnInit() {
    this.commonService.currentLocation = 'courseList';

    this.session.getDepartment().subscribe(department => {
      this.commonService.setTitle(`Courses at ${department.slug.toUpperCase()}`);

      this.auth.user$.subscribe((user) => {
        if (!user || user.role === 'student') {
          this.coursePager = this.courseService.getAllActiveByInstitute(department.slug);
        } else if (user.role === 'admin') {
          this.coursePager = this.courseService.getAllByInstitute(department.slug);
        } else if (user.role === 'TA' || user.role === 'lecturer') {
          this.coursePager = this.courseService.getAllByLecturerAndInstitute(user, department.slug);
        }
      });
    });
  }

  public getMoreCourses() {
    this.coursePager.more();
  }
}
