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
import { User } from 'src/app/models/user';
import { UserService } from 'src/app/services/user.service';

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
  private assistants: User[] = [];
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
              private courseService: CourseService,
              private instituteService: InstituteService,
              private userService: UserService) {}

  ngOnInit() {
    if (this.auth.isAdmin()) {
      this.courses$ = this.courseService.getAll();
    } else {
      this.courses$ = this.courseService.getByLecturer(this.auth.user);
    }
    this.institutes$ = this.instituteService.getAll();

    this.userService.getAll().subscribe(users => {
      this.allUsers = users;
      this.assistants = this.getUsersFromIDs(this.assistantIDs);
    });

    // Validate course slug when institute changes
    this.form.controls.instituteSlug.valueChanges
      .subscribe(() => {
        this.form.controls.courseSlug.updateValueAndValidity();
      });
  }

  public get f() {
    return this.form.controls;
  }

  private getUsersFromIDs(ids : string[]) : User[] {
    return ids.map( id => this.allUsers.find( user => user.uid == id) )
  }

  public userSearch(query : string) {
    query = query.toLowerCase();
    console.log(this.assistantIDs, this.allUsers);
    this.filteredUsers = this.allUsers
      .filter((user) => !(this.assistantIDs.includes(user.uid)))
      .filter((user) => user.email.toLocaleLowerCase().includes(query) || user.name.toLocaleLowerCase().includes(query));
    return this.filteredUsers;
  }

  public removeAssistant(assistantID : string) {
    this.assistantIDs = this.assistantIDs.filter( userID => userID !== assistantID);
    this.assistants = this.getUsersFromIDs(this.assistantIDs);
  }

  public attemptAddUser(userEmail) {
    console.log("Attemp to add user: ", userEmail);
    const user = this.allUsers.find( u => u.email == userEmail );
    if(user === undefined)
      return;
    
    if(user.role == 'student') {
      this.userService.setRole(user, 'assistant');
    }
    this.assistantIDs.push(user.uid);
    this.assistantIDs = [...new Set(this.assistantIDs)];
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

    this.assistantIDs = course.assistants;
    this.assistants   = this.getUsersFromIDs(this.assistantIDs);

    console.log(this.assistantIDs);

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

    this.assistants = [];
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

    if (!this.auth.isAdmin()) {
      course.assistants = [this.auth.user.uid];
    }

    this.courseService.createOrUpdateCourse(course);
  }

  private updateCourse() {
    const val = this.form.value;
    this.courseBeingEdited.title = val.title;
    this.courseBeingEdited.instituteSlug = val.instituteSlug;
    this.courseBeingEdited.slug = val.courseSlug.toLowerCase();
    this.courseBeingEdited.assistants = this.assistantIDs;

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
