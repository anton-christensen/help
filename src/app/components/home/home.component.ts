import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { Course } from 'src/app/models/course';
import { CourseService } from 'src/app/services/course.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styles: []
})
export class HomeComponent implements OnInit {
  public courseSlug: string;
  public course$: Observable<Course>;
  public courseEnabled: boolean; 

  constructor(public auth: AuthService,
              private courseService: CourseService,
              private route: ActivatedRoute) { }

  ngOnInit() {
    this.courseSlug = this.route.snapshot.paramMap.get('course');
    this.course$ = this.courseService.getCourseBySlug(this.courseSlug);
  }

}
