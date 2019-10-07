import {Component, OnInit} from '@angular/core';
import {FormGroup, FormControl, ValidationErrors, Validators, AbstractControl} from '@angular/forms';
import {TrashCanService} from 'src/app/services/trash-can.service';
import {Course} from 'src/app/models/course';
import {TrashCan} from '../../models/trash-can';
import {AuthService} from '../../services/auth.service';
import {SessionService} from '../../services/session.service';
import {Observable, of} from 'rxjs';
import {CommonService} from '../../services/common.service';
import {first, map, switchMap, tap} from 'rxjs/operators';

@Component({
  selector: 'app-student',
  templateUrl: './student.component.html',
  styleUrls: ['./student.component.scss']
})
export class StudentComponent implements OnInit {
  public course$: Observable<Course>;
  private course: Course;
  public trashCan$: Observable<TrashCan>;

  public form = new FormGroup({
    room: new FormControl('', [
      Validators.required,
      Validators.maxLength(10),
      this.roomValidator.bind(this)
    ]),
  });

  constructor(private auth: AuthService,
              private commonService: CommonService,
              private session: SessionService,
              private trashCanService: TrashCanService) { }

  ngOnInit() {
    this.course$ = this.session.getCourse$().pipe(
      tap((course) => {
        this.course = course;
        this.commonService.setTitle(`${course.slug.toUpperCase()}`);
      })
    );

    this.trashCan$ = this.course$.pipe(
      switchMap((course) => {
        if (course.enabled) {
          return this.trashCanService.getActiveByCourse(course);
        } else {
          return of([]);
        }
      }),
      map((trashcans) => trashcans[0])
    );
  }

  public onSubmit(): void {
    if (this.form.invalid) {
      console.error('You tried to save something invalid... How did you accomplish that?');
      return;
    }

    this.trashCanService.add(this.course, this.form.value.room).pipe(first()).subscribe();
  }

  public retractTrashCan(trashCan) {
    this.trashCanService.delete(trashCan).pipe(first()).subscribe();
  }

  private roomValidator(control: AbstractControl): ValidationErrors | null {
    const room = control.value;
    if (room && room.length === 0) {
      return null;
    }

    if (/^([\w\dæøå\._-]+ ?)+$/i.test(room) === false) {
      return {invalidRoom: true};
    }

    return null;
  }
}
