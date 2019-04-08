import {Component, OnInit, Input, OnDestroy} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {FormGroup, FormControl, ValidationErrors, Validators, AbstractControl} from '@angular/forms';
import {TrashCanService} from 'src/app/services/trash-can.service';
import {Course} from 'src/app/models/course';
import {Subscription} from "rxjs";
import {TrashCan} from '../../models/trash-can';

@Component({
  selector: 'app-student',
  templateUrl: './student.component.html',
  styleUrls: ['./student.component.scss']
})
export class StudentComponent implements OnInit, OnDestroy {
  @Input() public course: Course;
  public trashCan: TrashCan;
  private trashCanSubscription: Subscription;

  public form = new FormGroup({
    room: new FormControl('', [
      Validators.required,
      Validators.maxLength(10),
      this.roomValidator.bind(this)]),
  });

  constructor(private route: ActivatedRoute,
              private trashCanService: TrashCanService) {
  }

  ngOnInit() {
    this.trashCan = JSON.parse(localStorage.getItem(`trashCan-${this.course.slug}`));

    if (this.trashCan) {
      this.subscribeToTrashCan(this.trashCan);
    }
  }

  ngOnDestroy(): void {
    if (this.trashCan) {
      this.trashCanSubscription.unsubscribe();
    }
  }

  public onSubmit(): void {
    if (this.form.invalid) {
      console.error('You tried to save something invalid...');
      return;
    }

    this.trashCanService.addTrashCan(this.course.slug, this.form.value.room)
      .then((trashCan) => {
        this.trashCanSet(trashCan);
        this.form.reset();
      });
  }

  public retractTrashCan(): void {
    this.trashCanService.deleteTrashCan(this.trashCan);
  }

  private subscribeToTrashCan(trashCan: TrashCan): void {
    this.trashCanSubscription = this.trashCanService.getTrashById(trashCan.id)
      .subscribe((tc) => {
        if (!tc) {
          this.clearTrashCanId();
          this.trashCanSubscription.unsubscribe();
        }
      });
  }

  private trashCanSet(trashCan: TrashCan): void {
    localStorage.setItem(`trashCan-${this.course.slug}`, JSON.stringify(trashCan));
    this.trashCan = trashCan;
    this.subscribeToTrashCan(trashCan);
  }

  private clearTrashCanId(): void {
    localStorage.removeItem(`trashCan-${this.course.slug}`);
    this.trashCan = null;
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
