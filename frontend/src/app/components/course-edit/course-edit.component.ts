import {Component, OnInit} from '@angular/core';
import {CourseService} from 'src/app/services/course.service';
import {BehaviorSubject, combineLatest, merge, Observable, Subject, timer} from 'rxjs';
import {Course} from 'src/app/models/course';
import {Department} from 'src/app/models/department';
import {FormGroup, FormControl, Validators, AbstractControl, ValidationErrors} from '@angular/forms';
import {AuthService} from 'src/app/services/auth.service';
import {ModalService} from 'src/app/services/modal.service';
import {ToastService} from 'src/app/services/toasts.service';
import {DepartmentService} from 'src/app/services/department.service';
import {UserService} from 'src/app/services/user.service';
import {switchMap, map, first, take, debounceTime, distinctUntilChanged, shareReplay, tap} from 'rxjs/operators';
import {User} from 'src/app/models/user';
import {PaginatedResult} from '../../utils/paginated-result';


@Component({
  selector: 'app-course-edit',
  templateUrl: './course-edit.component.html',
  styleUrls: ['./course-edit.component.scss']
})
export class CourseEditComponent implements OnInit {
  /* COURSES */
  public departments$: Observable<Department[]>;
  public courses$: Observable<Course[]>;

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
    associatedUsers: new FormControl([], [
    ])
  });
  public get f() {
    return this.courseForm.controls;
  }

  public courseBeingEdited: Course;
  // public associatedUsers: User[];
  public newCourse = true;


  /* USERS */
  public usersForm = new FormGroup({
    query: new FormControl('', [Validators.email, Validators.pattern(/[.@]aau.dk$/)])
  });

  public foundUsers$: Observable<User[]>;
  public pageSize = 5;
  public currentPage = 0;
  public numPages = 0;
  private pageSubject = new BehaviorSubject<number>(this.currentPage);
  private overrideFoundUsersSubject = new Subject<PaginatedResult<User>>();

  constructor(public auth: AuthService,
              private modalService: ModalService,
              private toastService: ToastService,
              private courseService: CourseService,
              private departmentService: DepartmentService,
              private userService: UserService) {
  }

  ngOnInit() {
    this.resetForm();
    this.departments$ = this.departmentService.getAll();

    // Admins can see all courses, but only by department
    this.courses$ = this.auth.isAdmin().pipe(
      switchMap((isAdmin) => {
        if (isAdmin) {
          return this.coursesFilterForm.controls.departmentSlug.valueChanges.pipe(
            switchMap((departmentSlug) => {
              return this.courseService.getRelevantByDepartment(departmentSlug);
            })
          );
        } else {
          return this.courseService.getAllAssociated();
        }
      })
    );

    // Validate course slug when department changes
    this.courseForm.controls.departmentSlug.valueChanges
      .subscribe(() => {
        this.courseForm.controls.courseSlug.updateValueAndValidity();
      });

    this.foundUsers$ = merge(
      combineLatest([
        this.usersForm.controls.query.valueChanges.pipe(
          debounceTime(300),
          distinctUntilChanged(),
          tap(() => this.currentPage = 0)),
        this.pageSubject]).pipe(
        switchMap((values: [string, number]) => this.userService.searchByNameOrEmail(values[0].trim(), this.pageSize, this.currentPage))
      ),
      this.overrideFoundUsersSubject).pipe(
      tap((paginatedResult) => this.numPages = paginatedResult.numPages),
      map((paginatedResult) => paginatedResult.data),
      shareReplay(1),
    );
  }

  public editCourse(course: Course) {
    this.userService.getAllByID(course.associatedUserIDs).pipe(first())
      .subscribe((users) => {
        console.log(users);
        this.courseForm.reset({
          id: course.id,
          title: course.title,
          departmentSlug: course.departmentSlug,
          courseSlug: course.slug.toUpperCase(),
          associatedUsers: users
        });

        this.usersForm.reset({
          query: ''
        });

        this.courseBeingEdited = course;
        this.newCourse = false;
      });
  }

  public resetForm() {
    this.auth.user$.pipe(first())
      .subscribe((user: User) => {
        let users;
        if (user.role === 'admin') {
          users = [];
        } else {
          users = [user];
        }

        this.courseForm.reset({
          id: '',
          title: '',
          departmentSlug: '',
          courseSlug: '',
          associatedUsers: users
        });
        this.usersForm.reset({
          query: ''
        });

        this.courseBeingEdited = null;
        this.newCourse = true;
      });
  }

  public submitCourse() {
    if (this.newCourse) {
      this.createCourse();
    } else {
      this.updateCourse();
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
      associatedUserIDs: this.courseForm.value.associatedUsers.map((u) => u.id)
    };

    this.courseService.createOrUpdate(course).pipe(first()).subscribe();
  }

  private updateCourse() {
    this.courseBeingEdited.title = this.courseForm.value.title;
    this.courseBeingEdited.departmentSlug = this.courseForm.value.departmentSlug;
    this.courseBeingEdited.slug = this.courseForm.value.courseSlug.toLowerCase();
    this.courseBeingEdited.associatedUserIDs = this.courseForm.value.associatedUsers.map((u) => u.id);

    this.courseService.createOrUpdate(this.courseBeingEdited).pipe(first()).subscribe();
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

        this.courseService.delete(course).pipe(first())
          .subscribe(() => {
            if (this.courseBeingEdited && this.courseBeingEdited.id === course.id) {
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

  public onUserFormSubmit() {
    if (this.usersForm.invalid) {
      return;
    }

    this.userService.createUserWithEmail(this.usersForm.controls.query.value.trim()).pipe(first())
      .subscribe((user) => {
        this.addUserToCourse(user);

        this.overrideFoundUsersSubject.next({
          data: [user],
          numPages: 1
        })
      });
  }

  public addUserToCourse(user: User) {
    // Check if user is already in course
    if (this.courseForm.value.associatedUsers.find((u) => u.id === user.id)) {
      this.toastService.add('User is already in this course');
    } else {
      // Set role to TA if previously a student
      if (user.role === 'student') {
        this.userService.setRole(user, 'TA').pipe(first()).subscribe();
        user.role = 'TA';
      }
      this.courseForm.controls.associatedUsers.markAsDirty();
      this.courseForm.value.associatedUsers.push(user);
    }
  }

  public isUserInCourse(user: User): boolean {
    return !!this.courseForm.value.associatedUsers.find((u) => u.id === user.id);
  }

  public prevPage() {
    this.currentPage--;
    this.pageSubject.next(this.currentPage);
  }

  public nextPage() {
    this.currentPage++;
    this.pageSubject.next(this.currentPage);
  }
}
