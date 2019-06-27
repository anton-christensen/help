import {InstituteService} from '../../services/institute.service';
import {AbstractControl, FormControl, FormGroup, ValidationErrors, Validators} from '@angular/forms';
import {first, map, switchMap} from 'rxjs/operators';
import {CourseService} from '../../services/course.service';
import {Observable, timer} from 'rxjs';
import {Component, OnInit} from '@angular/core';
import {Institute} from '../../models/institute';
import {AuthService} from '../../services/auth.service';
import {ModalService} from '../../services/modal.service';
import {Course} from '../../models/course';

@Component({
  selector: 'app-course-edit',
  templateUrl: './course-edit.component.html',
  styleUrls: ['./course-edit.component.scss']
})
export class CourseEditComponent implements OnInit {
  public courses$: Observable<Course[]>;
  public institutes$: Observable<Institute[]>;

  public editing = false;
  private courseBeingEdited: Course;

  public form = new FormGroup({
    id: new FormControl(),
    title: new FormControl('', [
      Validators.required,
    ]),
    instituteSlug: new FormControl('', [
      Validators.required
    ]),
    courseSlug: new FormControl('', [
      Validators.required,
      Validators.minLength(2),
      Validators.maxLength(6),
    ], [
      this.courseSlugValidator.bind(this),
    ])
  });

  constructor(public auth: AuthService,
              private modalService: ModalService,
              private courseService: CourseService,
              private instituteService: InstituteService) {}

  ngOnInit() {
    if (this.auth.isAdmin()) {
      this.courses$ = this.courseService.getAll();
    } else {
      this.courses$ = this.courseService.getByLecturer(this.auth.user);
    }
    this.institutes$ = this.instituteService.getAll();

    // Validate course slug when institute changes
    this.form.controls.instituteSlug.valueChanges
      .subscribe(() => {
        this.form.controls.courseSlug.updateValueAndValidity();
      });
  }

  public get f() {
    return this.form.controls;
  }

  public editCourse(course: Course) {
    this.form.setValue({
      id: course.id,
      title: course.title,
      instituteSlug: course.instituteSlug,
      courseSlug: course.slug.toUpperCase(),
    });

    this.courseBeingEdited = course;
    this.editing = true;
  }

  public submitCourse() {
    if (this.editing) {
      this.updateCourse();
    } else {
      this.createCourse();
    }

    this.courseBeingEdited = null;
    this.editing = false;

    this.form.reset({
      id: '',
      title: '',
      instituteSlug: '',
      courseSlug: '',
    });
  }

  private createCourse() {
    const val = this.form.value;
    const course = new Course(val.id, val.title, val.instituteSlug, val.courseSlug.toLowerCase());

    if (!this.auth.isAdmin()) {
      course.lecturers = [this.auth.user.uid];
    }

    this.courseService.createOrUpdateCourse(course);
  }

  private updateCourse() {
    const val = this.form.value;
    this.courseBeingEdited.title = val.title;
    this.courseBeingEdited.instituteSlug = val.instituteSlug;
    this.courseBeingEdited.slug = val.courseSlug.toLowerCase();

    this.courseService.createOrUpdateCourse(this.courseBeingEdited);
  }

  public deleteCourse(course) {
    // Warn before delete
    this.modalService.add('Are you sure you want to delete ' + course.title).then(() => {
      this.courseService.deleteCourse(course);
    }).catch(() => {});
  }

  private courseSlugValidator(control: AbstractControl): Observable<ValidationErrors> {
    return timer(300).pipe(
      switchMap(() => {
        const instituteSlug = this.form.value.instituteSlug;
        const courseSlug = control.value.toLowerCase();

        return this.courseService.getBySlug(instituteSlug, courseSlug).pipe(
          map((result) => {
            if (result) {
              if (this.form.value.id === result.id) {
                return null;
              } else {
                return {courseSlugTaken: true};
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
}
