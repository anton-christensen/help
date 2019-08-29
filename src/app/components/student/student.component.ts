import {Component, OnInit, Input, OnDestroy} from '@angular/core';
import {FormGroup, FormControl, ValidationErrors, Validators, AbstractControl} from '@angular/forms';
import {TrashCanService} from 'src/app/services/trash-can.service';
import {Course} from 'src/app/models/course';
import {TrashCan} from '../../models/trash-can';
import {AuthService} from '../../services/auth.service';
import {SessionService} from '../../services/session.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-student',
  templateUrl: './student.component.html',
  styleUrls: ['./student.component.scss']
})
export class StudentComponent implements OnInit, OnDestroy {
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
              private session: SessionService,
              private trashCanService: TrashCanService) { }

  ngOnInit() {
    if (!this.auth.user) {
      this.auth.anonymousSignIn();
    }

    this.course$ = this.session.getCourse$();

    this.course$
      .subscribe((course) => {
        this.course = course;

        this.trashCan$ = this.trashCanService.getOwnedByCourse(course);
      });
  }

  ngOnDestroy(): void {
  }

  public onSubmit(): void {
    if (!this.auth.user) {
      this.auth.anonymousSignIn()
        .then((res) => {
          console.log(res);
          this.save(res.user.uid);
        });
    } else {
      this.save(this.auth.user.id);
    }
  }

  private save(userID: string) {
    if (this.form.invalid) {
      console.error('You tried to save something invalid... How did you accomplish that?');
      return;
    }

    this.trashCanService.addTrashCan(this.course, this.form.value.room, userID);
  }

  public retractTrashCan(trashCan): Promise<any> {
    return this.trashCanService.deleteTrashCan(trashCan);
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
