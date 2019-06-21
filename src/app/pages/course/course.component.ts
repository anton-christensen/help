import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { ActivatedRoute } from '@angular/router';
import { Course } from 'src/app/models/course';
import {SessionService} from '../../services/session.service';
import {Observable} from 'rxjs';

@Component({
  selector: 'app-course',
  templateUrl: './course.component.html',
  styles: ['./course.component.scss']
})
export class CourseComponent implements OnInit {
  public course$: Observable<Course>;
  public course: Course;

  constructor(public auth: AuthService,
              private session: SessionService,
              private route: ActivatedRoute) { }

  ngOnInit() {
    const courseSlug = this.route.snapshot.paramMap.get('course');
    this.session.setCourse(courseSlug);

    this.course$ = this.session.getCourse$();
    this.course = this.session.getCourse();
  }

}
