import { Component, OnInit } from '@angular/core';
import { Observable, timer } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';
import { CourseService } from 'src/app/services/course.service';
import { Course } from 'src/app/models/course';
import { FormGroup, FormControl, AbstractControl, ValidationErrors, Validators } from '@angular/forms';
import { ModalService } from 'src/app/services/modal.service';
import { switchMap, first, map } from 'rxjs/operators';
import { Institute } from 'src/app/models/institute';
import { InstituteService } from 'src/app/services/institute.service';


@Component({
  selector: 'app-lecturer',
  templateUrl: './lecturer.component.html',
  styleUrls: ['./lecturer.component.scss']
})
export class LecturerComponent implements OnInit {
  public courses$: Observable<Course[]>;
  public institutes$: Observable<Institute[]>;

  public editing = false;
  public shortHandHasBeenEdited = false;

  public form = new FormGroup({
    id: new FormControl(),
    title: new FormControl('', Validators.required),
    institute: new FormControl('', Validators.required),
    shorthand: new FormControl('',
      Validators.required,
      this.shorthandValidator.bind(this)),
  });

  constructor(public auth: AuthService,
              private modalService: ModalService,
              private courseService: CourseService,
              private instituteService: InstituteService) {}

  ngOnInit() {
    this.courses$ = this.courseService.getAll();
    this.institutes$ = this.instituteService.getAll();
  }

  shorthandValidator(control: AbstractControl): Observable<ValidationErrors> {
    return timer(300).pipe(
        switchMap(() => {
            const slug = control.value.toLowerCase();
            return this.courseService.getBySlug(slug).pipe(
              map((result) => {
                if (result) {
                  if (this.form.value.id === result.id) {
                    return null;
                  } else {
                    return {shorthandInUse: true};
                  }
                } else {
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
      title: course.title,
      institute: course.instituteSlug,
      shorthand: course.slug.toUpperCase(),
    });

    this.editing = true;
  }

  public submitCourse() {
    const val = this.form.value;
    this.courseService.createOrUpdateCourse(
      new Course(val.id, val.title, val.institute, val.shorthand.toLowerCase(), false)
    );
  }

  public deleteCourse(course) {
    // Warn before delete
    this.modalService.add('Are you sure you want to delete ' + course.title).then(() => {
      this.courseService.deleteCourse(course);
    }).catch(() => {});
  }
}
