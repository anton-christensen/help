import { Component, OnInit } from '@angular/core';
import { CoursePager, CourseService } from 'src/app/services/course.service';
import { Observable, timer, of, combineLatest, Subject } from 'rxjs';
import { Course } from 'src/app/models/course';
import { Department } from 'src/app/models/department';
import { FormGroup, FormControl, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { AuthService } from 'src/app/services/auth.service';
import { ModalService } from 'src/app/services/modal.service';
import { ToastService } from 'src/app/services/toasts.service';
import { DepartmentService } from 'src/app/services/department.service';
import { UserService } from 'src/app/services/user.service';
import {switchMap, map, first, take} from 'rxjs/operators';
import { User } from 'src/app/models/user';


@Component({
  selector: 'app-course-edit',
  templateUrl: './course-edit.component.html',
  styleUrls: ['./course-edit.component.scss']
})
export class CourseEditComponent implements OnInit {
  public coursesPager: CoursePager;
  public departments$: Observable<Department[]>;

  public coursesFilterForm = new FormGroup({
    departmentSlug: new FormControl('', [
      Validators.required
    ]),
  });

  public courseForm = new FormGroup({
    id: new FormControl(''),
    title: new FormControl('', [
      Validators.required,
    ]),
    departmentSlug: new FormControl('', [
      Validators.required
    ]),
    courseSlug: new FormControl('', [
      Validators.required,
      Validators.minLength(2),
      Validators.maxLength(6),
    ], [
      this.courseSlugValidator.bind(this),
    ]),
  });
  public get f() {
    return this.courseForm.controls;
  }
  public editing = false;
  public courseBeingEdited: Course;

  public usersForm = new FormGroup({
    email: new FormControl('', [Validators.email, Validators.pattern(/[.@]aau.dk$/)])
  });
  private email$ = new Subject<string>();
  public user$: Observable<User>;
  private user: User;
  public gettingUser = false;
  public associatedUsers: User[];

  constructor(public auth: AuthService,
              private modalService: ModalService,
              private toastService: ToastService,
              private courseService: CourseService,
              private departmentService: DepartmentService,
              private userService: UserService) {}

  ngOnInit() {
    this.resetForm();
    this.coursesFilterForm.controls.departmentSlug.valueChanges
      .subscribe((departmentSlug) => {
        if (this.auth.user && this.auth.user.role === 'admin') {
          this.coursesPager = this.courseService.getAllByDepartment(departmentSlug);
        }
      });

    this.auth.user$.subscribe(user => {
      if (!user) {
        this.coursesPager = null;
      } else if (user.role === 'admin') {
        // ...
      } else {
        this.coursesPager = this.courseService.getAllByLecturer(user);
      }
    });

    this.departments$ = this.departmentService.getAll();

    // Validate course slug when department changes
    this.courseForm.controls.departmentSlug.valueChanges
      .subscribe(() => {
        this.courseForm.controls.courseSlug.updateValueAndValidity();
      });

    this.user$ = this.email$.pipe(
      switchMap((email: string) => {
        this.gettingUser = true;
        return this.userService.getByEmail(email);
      })
    );

    this.user$
      .subscribe((user) => {
        this.gettingUser = false;
        this.user = user;
      });

    this.usersForm.controls.email.valueChanges
      .subscribe((email) => {
        this.findUser(email.trim());
      });
  }

  public loadMoreCourses() {
    this.coursesPager.more();
  }

  public onUserFormSubmit() {
    if (this.usersForm.invalid) {
      return;
    }

    if (this.user) {
      this.addUserToCourse(this.user);
    } else {
      this.userService.createUserWithEmail(this.usersForm.controls.email.value)
        .then((user) => {
          this.addUserToCourse(user);
          this.findUser(user.email);
        });
    }
  }

  private findUser(email: string) {
    if (this.user || /[.@]aau.dk$/.test(email.toLowerCase())) {
      this.email$.next(email);
    }
  }

  private addUserToCourse(user: User) {
    // Check if user is already in course
    if (this.associatedUsers.find((u) => u.id === user.id)) {
      this.toastService.add('User is already in this course');
    } else {
      if (user.role === 'student') {
        this.userService.setRole(user, 'TA');
        user.role = 'TA';
      }
      this.associatedUsers.push(user);

      this.usersForm.reset({
        email: ''
      });
    }
  }

  public removeUserFromCourse(user: User) {
    const newAssociatedUsers = this.associatedUsers.filter((u) => u.id !== user.id);

    // Check if this removal means there are no admins og lecturers left
    if (!newAssociatedUsers.find((u) => u.role === 'admin' || u.role === 'lecturer')) {
      this.toastService.add('There must be at least one admin or lecturer associated with every course');
    } else {
      this.associatedUsers = newAssociatedUsers;
    }
  }

  public editCourse(course: Course) {
    this.courseForm.setValue({
      id: course.id,
      title: course.title,
      departmentSlug: course.departmentSlug,
      courseSlug: course.slug.toUpperCase(),
    });
    this.usersForm.reset({
      email: ''
    });

    this.userService.getAllByID(course.associatedUserIDs).pipe(
      take(1)
    ).subscribe((users) => {
      this.associatedUsers = users;
    });

    this.courseBeingEdited = course;
    this.editing = true;
  }

  public resetForm() {
    this.courseBeingEdited = null;
    this.associatedUsers = [this.auth.user];
    this.editing = false;

    this.courseForm.reset({
      id: '',
      title: '',
      departmentSlug: '',
      courseSlug: '',
    });
    this.usersForm.reset({
      email: ''
    });
  }

  public submitCourse() {
    if (this.editing) {
      this.updateCourse();
    } else {
      this.createCourse();
    }

    this.resetForm();
  }

  private createCourse() {
    const course: Course = {
      id: this.courseForm.value.id,
      title: this.courseForm.value.title,
      departmentSlug: this.courseForm.value.departmentSlug,
      slug: this.courseForm.value.courseSlug.toLowerCase(),
      enabled: false,
      numTrashCansThisSession: 0,
      associatedUserIDs: this.associatedUsers.map((u) => u.id)
    };

    this.courseService.createOrUpdateCourse(course);
  }

  private updateCourse() {
    this.courseBeingEdited.title = this.courseForm.value.title;
    this.courseBeingEdited.departmentSlug = this.courseForm.value.departmentSlug;
    this.courseBeingEdited.slug = this.courseForm.value.courseSlug.toLowerCase();
    this.courseBeingEdited.associatedUserIDs = this.associatedUsers.map((u) => u.id);

    this.courseService.createOrUpdateCourse(this.courseBeingEdited);
  }

  public deleteCourse(course: Course) {
    // Warn before delete
    this.modalService.add(
      'Are you sure you want to delete the course ' + course.title,
      {text: 'Yes, delete', type: 'negative'},
      {text: 'No, keep it', type: 'neutral'})
      .then((btn) => {
        if (btn.type !== 'negative') {
          return;
        }

        this.coursesPager.removeOneHack(course);
        this.courseService.deleteCourse(course).then(() => {
          if (this.editing && this.courseBeingEdited.id === course.id) {
            this.resetForm();
          }
        });
      })
      .catch();
  }

  private courseSlugValidator(control: AbstractControl): Observable<ValidationErrors> {
    return timer(300).pipe(
      switchMap(() => {
        const departmentSlug = this.courseForm.value.departmentSlug;
        const courseSlug = control.value.toLowerCase();

        return this.courseService.getBySlug(departmentSlug, courseSlug).pipe(
          map((result) => {
            if (result) {
              if (this.courseForm.value.id === result.id) {
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
