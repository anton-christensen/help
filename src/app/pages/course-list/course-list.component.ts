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
              private courseService: CourseService) {}

  ngOnInit() {
    const instituteSlug = this.route.snapshot.paramMap.get('institute');
    this.session.setInstitute(instituteSlug);

    this.courses$ = this.courseService.getAllByInstitute(instituteSlug);
  }

  activeCourses(courses: Course[]): Course[] {
    return courses.filter(c => c.enabled);
  }

  relevantCourses(courses: Course[]): Course[] {
    return courses.filter(c => this.auth.user.courses.includes(c.slug));
  }
}
