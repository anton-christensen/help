import { Component, OnInit } from '@angular/core';
import { CourseService } from 'src/app/services/course.service';
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

  constructor(public auth: AuthService,
              private route: ActivatedRoute,
              private session: SessionService,
              private courseService: CourseService) {
              }

  ngOnInit() {
    this.session.getInstitute$().subscribe(institute => {
      this.courses$ = this.courseService.getAllByInstitute(institute.slug);
    });
  }

  activeCourses(courses: Course[]): Course[] {
    return courses.filter(c => c.enabled);
  }

  relevantCourses(courses: Course[]): Course[] {
    return courses.filter((c) => {
      const uid = this.auth.user.uid;
      return c.associatedUserIDs.includes(this.auth.user.uid);
    });
  }
}
