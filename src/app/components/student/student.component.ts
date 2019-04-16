import {Component, OnInit, Input, OnDestroy} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {FormGroup, FormControl, ValidationErrors, Validators, AbstractControl} from '@angular/forms';
import {TrashCanService} from 'src/app/services/trash-can.service';
import {Course} from 'src/app/models/course';
import {TrashCan} from '../../models/trash-can';
import {AuthService} from '../../services/auth.service';

@Component({
  selector: 'app-student',
  templateUrl: './student.component.html',
  styleUrls: ['./student.component.scss']
})
export class StudentComponent implements OnInit, OnDestroy {
  @Input() public course: Course;
  public trashCan: TrashCan;

  public form = new FormGroup({
    room: new FormControl('', [
      Validators.required,
      Validators.maxLength(10),
      this.roomValidator.bind(this)]),
  });

  constructor(private route: ActivatedRoute,
              private auth: AuthService,
              private trashCanService: TrashCanService) {
  }

  ngOnInit() {
    this.trashCanService.getMyTrashCanByUser(this.course)
      .subscribe((tc) => {
        this.trashCan = tc;
      });
  }

  ngOnDestroy(): void {}

  public onSubmit(): void {
    if (!this.auth.user) {
      this.auth.anonymousSignIn()
        .then(() => {
          this.save();
        });
    } else {
      this.save();
    }

  }

  private save() {
    if (this.form.invalid) {
      console.error('You tried to save something invalid... How did you accomplish that?');
      return;
    }

    this.trashCanService.addTrashCan(this.course.slug, this.form.value.room)
      .then((trashCan) => {
        this.form.reset();
      });
  }

  public retractTrashCan(): void {
    this.trashCanService.deleteTrashCan(this.trashCan);
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
