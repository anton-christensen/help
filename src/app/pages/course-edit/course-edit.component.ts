import {InstituteService} from '../../services/institute.service';
import {AbstractControl, FormControl, FormGroup, ValidationErrors, Validators} from '@angular/forms';
import {first, map, switchMap} from 'rxjs/operators';
import {CourseService} from '../../services/course.service';
import {Observable, of, timer} from 'rxjs';
import {Component, OnInit} from '@angular/core';
import {Institute} from '../../models/institute';
import {AuthService} from '../../services/auth.service';
import {ModalService} from '../../services/modal.service';
import {Course} from '../../models/course';
import {User} from 'src/app/models/user';
import {UserService} from 'src/app/services/user.service';
import {ToastService} from 'src/app/services/toasts.service';

@Component({
  selector: 'app-course-edit',
  templateUrl: './course-edit.component.html',
  styleUrls: ['./course-edit.component.scss']
})
export class CourseEditComponent implements OnInit {
  public courses$: Observable<Course[]>;
  public institutes$: Observable<Institute[]>;

  private allUsers: User[] = [];
  private filteredUsers: User[] = [];
  public assistants: User[] = [];
  private assistantIDs: string[] = [];

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
    ]),
  });

  public filterSearchForm = new FormGroup({
    userSearch: new FormControl('')
  });

  constructor(public auth: AuthService,
              private modalService: ModalService,
              private toastService: ToastService,
              private courseService: CourseService,
              private instituteService: InstituteService,
              private userService: UserService) {}

  ngOnInit() {
    this.resetForm();

    this.courses$ = this.auth.user$.pipe(
      switchMap((user) => {
        if (!user) {
          return of([]);
        } else {
          if (user.role === 'admin') {
            return this.courseService.getAll();
          } else {
            return this.courseService.getByLecturer(user);
          }
        }
      })
    );

    this.institutes$ = this.instituteService.getAll();

    this.userService.getAll().subscribe((users) => {
      this.allUsers = users;
      this.assistants = this.getUsersFromIDs(this.assistantIDs);
    });

    // Validate course slug when department changes
    this.form.controls.instituteSlug.valueChanges
      .subscribe(() => {
        this.form.controls.courseSlug.updateValueAndValidity();
      });
  }

  public get f() {
    return this.form.controls;
  }

  private getUsersFromIDs(ids: string[]): User[] {
    return ids.map((id) => this.allUsers.find((user) => user.id === id));
  }

  public userSearch(query: string) {
    query = query.toLowerCase();
    this.filteredUsers = this.allUsers
      .filter((user) => !(this.assistantIDs.includes(user.id)))
      .filter((user) => user.email.toLocaleLowerCase().includes(query) || user.name.toLocaleLowerCase().includes(query));
    return this.filteredUsers;
  }

  public removeAssistant(assistantID: string) {
    const newListIDs = this.assistantIDs.filter((userID) => userID !== assistantID);
    const newListUsers = this.getUsersFromIDs(newListIDs);

    // if there are no admins or lecturer left in course
    if (newListUsers.findIndex((user) => ['admin', 'lecturer'].includes(user.role)) === -1) {
      this.toastService.add('There must be at least one admin or lecturer associated with every course');
      return;
    }

    this.assistantIDs = newListIDs;
    this.assistants = newListUsers;
  }

  public attemptAddUser(userEmail) {
    const user = this.allUsers.find((u) => u.email === userEmail);
    if (user === undefined) {
      return;
    }

    if (user.role === 'student') {
      this.userService.setRole(user, 'assistant');
    }

    this.assistantIDs.push(user.id);
    this.assistantIDs = Array.from(new Set(this.assistantIDs));
    this.assistants = this.getUsersFromIDs(this.assistantIDs);

    this.filterSearchForm.reset({
      userSearch: ''
    });
  }

  public editCourse(course: Course) {
    this.form.setValue({
      id: course.id,
      title: course.title,
      instituteSlug: course.instituteSlug,
      courseSlug: course.slug.toUpperCase(),
    });
    this.filterSearchForm.setValue({
      userSearch: ''
    });

    this.assistantIDs = course.associatedUserIDs;
    this.assistants   = this.getUsersFromIDs(this.assistantIDs);

    this.courseBeingEdited = course;
    this.editing = true;
  }

  public resetForm() {
    this.courseBeingEdited = null;
    this.editing = false;

    this.form.reset({
      id: '',
      title: '',
      instituteSlug: '',
      courseSlug: '',
    });
    this.filterSearchForm.reset({
      userSearch: ''
    });

    this.assistantIDs = [this.auth.user.id];
    this.assistants = [this.auth.user];
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
    const val = this.form.value;
    const course = new Course(val.id, val.title, val.instituteSlug, val.courseSlug.toLowerCase());

    this.courseService.createOrUpdateCourse(course);
  }

  private updateCourse() {
    const val = this.form.value;
    this.courseBeingEdited.title = val.title;
    this.courseBeingEdited.instituteSlug = val.instituteSlug;
    this.courseBeingEdited.slug = val.courseSlug.toLowerCase();
    this.courseBeingEdited.associatedUserIDs = this.assistantIDs;

    this.courseService.createOrUpdateCourse(this.courseBeingEdited);
  }

  public deleteCourse(course: Course) {
    // Warn before delete
    this.modalService.add('Are you sure you want to delete ' + course.title, 'Delete', 'Cancel').then(() => {
      this.courseService.deleteCourse(course).then(() => {
        if (this.editing && this.courseBeingEdited.id === course.id) {
          this.resetForm();
        }
      });
    }).catch();
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
