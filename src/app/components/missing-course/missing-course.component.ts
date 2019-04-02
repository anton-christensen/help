import { Component, OnInit } from '@angular/core';
import { CourseService } from 'src/app/services/course.service';
import { Observable } from 'rxjs';
import { Course } from 'src/app/models/course';

@Component({
  selector: 'app-missing-course',
  templateUrl: './missing-course.component.html',
  styles: []
})
export class MissingCourseComponent implements OnInit {
  public enabledCourses$: Observable<Course[]>;

  constructor(private courseService: CourseService) {}

  ngOnInit() {
    this.enabledCourses$ = this.courseService.getEnabledCourses();
  }

}
