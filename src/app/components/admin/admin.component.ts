import { Component, OnInit } from '@angular/core';
import { Observable, timer } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';
import { CourseService } from 'src/app/services/course.service';
import { Course } from 'src/app/models/course';
import { FormGroup, FormControl, AbstractControl, ValidationErrors, Validators } from '@angular/forms';
import { ModalService } from 'src/app/services/modal.service';
import { switchMap, first, map } from 'rxjs/operators';


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
    shorthand: new FormControl('', 
      Validators.required,
      this.shorthandValidator.bind(this)),
    title: new FormControl('', Validators.required)
  });

  constructor(public auth: AuthService,
              private modalService: ModalService,
              private courseService: CourseService) {}

  ngOnInit() {
    this.courses$ = this.courseService.getAllCourses();
  }

  shorthandValidator(control: AbstractControl): Observable<ValidationErrors> {
    return timer(300).pipe(
        switchMap(() => {
            const slug = control.value.toLowerCase();
            return this.courseService.getCourseBySlug(slug).pipe(
              map((result) => {
                if(result) {
                  if(this.form.value.id == result.id)
                    return null;
                  else
                    return {shorthandInUse: true};
                }
                else {
                  return null;
                }
              }),
              first()
            );
        })
    );
  }

  public editCourse(course: Course) {
    this.form.setValue({
      id: course.id,
      shorthand: course.slug.toLowerCase(),
      title: course.title,
    });

    this.editing = true;
  }

  public submitCourse() {
    const val = this.form.value;
    this.courseService.createOrUpdateCourse(
      new Course(val.id, val.title, val.shorthand.toLowerCase(), false)
    );
  }

  public deleteCourse(course) {
    // Warn before delete
    this.modalService.add("Are you sure you wanna delete "+course.title).then(() => {
      this.courseService.deleteCourse(course);
    }).catch(() => {});
  }
}
