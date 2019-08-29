import { Component, OnInit } from '@angular/core';
import { CourseService, CoursePager } from 'src/app/services/course.service';
import { Observable } from 'rxjs';
import { Course } from 'src/app/models/course';
import {AuthService} from '../../services/auth.service';
import {SessionService} from '../../services/session.service';
import {ActivatedRoute} from '@angular/router';

@Component({
  selector: 'app-course-list',
  templateUrl: './course-list.component.html',
  styleUrls: ['./course-list.component.scss']
})
export class CourseListComponent implements OnInit {
  public courses$: Observable<Course[]>;
  public coursePager: CoursePager;

  constructor(public auth: AuthService,
              private session: SessionService,
              private courseService: CourseService) {}

  ngOnInit() {
    this.session.getInstitute$().subscribe(institute => {
      this.auth.user$.subscribe((user) => {
        if(!user || user.role == 'student') {
          this.coursePager = this.courseService.getAllActiveByInstitute(institute.slug);
        }
        else if(user.role == 'admin') {
          this.coursePager = this.courseService.getAllByInstitute(institute.slug);
        }
        else if(user.role == 'TA' || user.role == 'lecturer') {
          this.coursePager = this.courseService.getAllByLecturerAndInstitute(user, institute.slug);
        }
      });
    });
  }

  getMoreCourses() {
    this.coursePager.more();
  }

  activeCourses(courses: Course[]): Course[] {
    return courses.filter(c => c.enabled);
  }

  relevantCourses(courses: Course[]): Course[] {
    return courses.filter((c) => {
      return c.associatedUserIDs.includes(this.auth.user.id);
    });
  }
}
