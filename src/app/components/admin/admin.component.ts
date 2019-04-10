import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';
import { CourseService } from 'src/app/services/course.service';
import { Course } from 'src/app/models/course';
import { FormGroup, FormControl } from '@angular/forms';
import { ModalService } from 'src/app/services/modal.service';


@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {
  public courses$: Observable<Course[]>;
  public editing = false;

  public form = new FormGroup({
    id: new FormControl(),
    slug: new FormControl(''),
    title: new FormControl('')
  });

  constructor(public auth: AuthService,
              private modalService: ModalService,
              private courseService: CourseService) {}

  ngOnInit() {
    this.courses$ = this.courseService.getAllCourses();
  }

  public editCourse(course: Course) {
    this.form.setValue({
      id: course.id,
      slug: course.slug,
      title: course.title,
    });

    this.editing = true;
  }

  public deleteCourse(course) {
    // Warn before delete
    this.courseService.deleteCourse(course);
  }
}
