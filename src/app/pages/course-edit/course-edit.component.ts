import { Component, OnInit } from '@angular/core';
import { Pager, CourseService } from 'src/app/services/course.service';
import { Observable, timer, of, combineLatest, Subject } from 'rxjs';
import { Course } from 'src/app/models/course';
import { Institute } from 'src/app/models/institute';
import { FormGroup, FormControl, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { AuthService } from 'src/app/services/auth.service';
import { ModalService } from 'src/app/services/modal.service';
import { ToastService } from 'src/app/services/toasts.service';
import { InstituteService } from 'src/app/services/institute.service';
import { UserService } from 'src/app/services/user.service';
import { switchMap, map, first } from 'rxjs/operators';
import { User } from 'src/app/models/user';


@Component({
  selector: 'app-course-edit',
  templateUrl: './course-edit.component.html',
  styleUrls: ['./course-edit.component.scss']
})
export class CourseEditComponent implements OnInit {
  public coursesPager: Pager;
  public courses$: Observable<Course[]>;
  public institutes$: Observable<Institute[]>;

  // private allUsers: User[] = [];
  // private filteredUsers: User[] = [];
  // public assistants: User[] = [];
  // private assistantIDs: string[] = [];

  public editing = false;
  private courseBeingEdited: Course;

  public coursesFilterForm = new FormGroup({
    instituteSlug: new FormControl('', [
      Validators.required
    ]),
  });

  public courseEdit = new FormGroup({
    id: new FormControl(''),
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

  private email$ = new Subject<string>();
  public user$: Observable<User>;
  private user: User;
  public gettingUser = false;

  public usersForm = new FormGroup({
    email: new FormControl('', [Validators.email, Validators.pattern(/[.@]aau.dk$/)])
  });

  public usersInCourse$: Observable<User[]>;

  constructor(public auth: AuthService,
              private modalService: ModalService,
              private toastService: ToastService,
              private courseService: CourseService,
              private instituteService: InstituteService,
              private userService: UserService) {}

  ngOnInit() {
    this.resetForm();
    this.coursesFilterForm.controls.instituteSlug.valueChanges
      .subscribe((instituteSlug) => {
        if(this.auth.user && this.auth.user.role === 'admin') {
          this.coursesPager = this.courseService.getAllByInstitute(instituteSlug);
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

    this.institutes$ = this.instituteService.getAll();

    // this.userService.getAll().subscribe((users) => {
    //   this.allUsers = users;
    //   this.assistants = this.getUsersFromIDs(this.assistantIDs);
    // });


    // Validate course slug when department changes
    this.courseEdit.controls.instituteSlug.valueChanges
      .subscribe(() => {
        this.courseEdit.controls.courseSlug.updateValueAndValidity();
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

  onUserFormSubmit() {
    if (this.courseEdit.invalid) {
      return;
    }

    this.userService.createUserWithEmail(this.courseEdit.controls.email.value)
      .then(() => {
        this.findUser(this.courseEdit.controls.email.value);
      });
  }

  private findUser(email: string) {
    if (this.user || /[.@]aau.dk$/.test(email.toLowerCase())) {
      this.email$.next(email);
    }
  }

  public get f() {
    return this.courseEdit.controls;
  }

  // private getUsersFromIDs(ids: string[]): User[] {
  //   return ids.map((id) => this.allUsers.find((user) => user.id === id));
  // }

  // public userSearch(query: string) {
  //   query = query.toLowerCase();
  //   this.filteredUsers = this.allUsers
  //     .filter((user) => !(this.assistantIDs.includes(user.id)))
  //     .filter((user) => user.email.toLocaleLowerCase().includes(query) || user.name.toLocaleLowerCase().includes(query));
  //   return this.filteredUsers;
  // }

  public removeUserFromCourse(user: User) {
    const newAssociatedUsers = this.courseBeingEdited.associatedUsers.filter((u) => u.id !== user.id);

    // const newListIDs = this.assistantIDs.filter((userID) => userID !== assistantID);
    // const newListUsers = this.getUsersFromIDs(newListIDs);

    // if there are no admins or lecturer left in course
    if (!newAssociatedUsers.find((u) => u.role === 'admin' || u.role === 'lecturer')) {
      this.toastService.add('There must be at least one admin or lecturer associated with every course');
    } else {
      this.courseBeingEdited.associatedUsers = newAssociatedUsers;
      this.courseBeingEdited.associatedUserIDs = newAssociatedUsers.map((u) => user.id);
    }

    // this.assistantIDs = newListIDs;
    // this.assistants = newListUsers;
  }

  // public attemptAddUser(userEmail) {
  //   const user = this.allUsers.find((u) => u.email === userEmail);
  //   if (user === undefined) {
  //     return;
  //   }
  //
  //   if (user.role === 'student') {
  //     this.userService.setRole(user, 'TA');
  //   }
  //
  //   this.assistantIDs.push(user.id);
  //   this.assistantIDs = Array.from(new Set(this.assistantIDs));
  //   this.assistants = this.getUsersFromIDs(this.assistantIDs);
  //
  //   this.usersForm.reset({
  //     email: ''
  //   });
  // }

  public editCourse(course: Course) {
    console.log(course);
    this.courseEdit.setValue({
      id: course.id,
      title: course.title,
      instituteSlug: course.instituteSlug,
      courseSlug: course.slug.toUpperCase(),
    });
    this.usersForm.reset({
      email: ''
    });

    this.usersInCourse$ = this.userService.getAllByID(course.associatedUserIDs);
    this.usersInCourse$
      .subscribe((users) => {
        course.associatedUsers = users;
      });

    // this.assistantIDs = course.associatedUserIDs;
    // this.assistants   = this.getUsersFromIDs(this.assistantIDs);

    this.courseBeingEdited = course;
    this.editing = true;
  }

  public resetForm() {
    this.courseBeingEdited = null;
    this.editing = false;

    this.courseEdit.reset({
      id: '',
      title: '',
      instituteSlug: '',
      courseSlug: '',
    });
    this.usersForm.reset({
      email: ''
    });

    // this.assistantIDs = [this.auth.user.id];
    // this.assistants = [this.auth.user];
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
    const val = this.courseEdit.value;
    const course = new Course(val.id, val.title, val.instituteSlug, val.courseSlug.toLowerCase());

    this.courseService.createOrUpdateCourse(course);
  }

  private updateCourse() {
    const val = this.courseEdit.value;
    this.courseBeingEdited.title = val.title;
    this.courseBeingEdited.instituteSlug = val.instituteSlug;
    this.courseBeingEdited.slug = val.courseSlug.toLowerCase();
    // this.courseBeingEdited.associatedUserIDs = this.assistantIDs;

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
        const instituteSlug = this.courseEdit.value.instituteSlug;
        const courseSlug = control.value.toLowerCase();

        return this.courseService.getBySlug(instituteSlug, courseSlug).pipe(
          map((result) => {
            if (result) {
              if (this.courseEdit.value.id === result.id) {
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
