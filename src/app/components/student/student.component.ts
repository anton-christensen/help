import {Component, OnInit, Input, OnDestroy} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {FormGroup, FormControl, ValidationErrors, Validators, AbstractControl} from '@angular/forms';
import {TrashCanService} from 'src/app/services/trash-can.service';
import {Course} from 'src/app/models/course';
import {TrashCan} from '../../models/trash-can';
import {AuthService} from '../../services/auth.service';
import {SessionService} from '../../services/session.service';
import {Subscription} from 'rxjs';

@Component({
  selector: 'app-student',
  templateUrl: './student.component.html',
  styleUrls: ['./student.component.scss']
})
export class StudentComponent implements OnInit, OnDestroy {
  public course: Course;
  public trashCan: TrashCan;

  public form = new FormGroup({
    room: new FormControl('', [
      Validators.required,
      Validators.maxLength(10),
      this.roomValidator.bind(this)
    ]),
  });

  constructor(private route: ActivatedRoute,
              private auth: AuthService,
              private session: SessionService,
              private trashCanService: TrashCanService) { }

  ngOnInit() {
    if (!this.auth.user) {
      this.auth.anonymousSignIn();
    }

    this.course = this.session.getCourse();

    this.trashCanService.getOwnedByCourse(this.course)
      .subscribe((tc) => {
        this.trashCan = tc;
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
      this.save(this.auth.user.uid);
    }
  }

  private save(uid: string) {
    if (this.form.invalid) {
      console.error('You tried to save something invalid... How did you accomplish that?');
      return;
    }

    this.trashCanService.addTrashCan(this.course, this.form.value.room, uid)
      .then((tc) => {
        this.form.reset();
      });
  }

  public retractTrashCan(): Promise<any> {
    return this.trashCanService.deleteTrashCan(this.trashCan);
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
