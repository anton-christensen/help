import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { Course } from 'src/app/models/course';
import { CourseService } from 'src/app/services/course.service';

@Component({
  selector: 'app-course',
  templateUrl: './course.component.html',
  styles: ['./course.component.scss']
})
export class CourseComponent implements OnInit {
  public course$: Observable<Course>;

  constructor(public auth: AuthService,
              private courseService: CourseService,
              private route: ActivatedRoute) { }

  ngOnInit() {
    console.log(this.auth.user$.subscribe(user => console.log(user)));
    const courseSlug = this.route.snapshot.paramMap.get('course');
    this.course$ = this.courseService.getBySlug(courseSlug);
  }

}
