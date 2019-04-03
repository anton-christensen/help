import {Component, OnInit, Input, OnDestroy} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {FormGroup, FormControl, ValidationErrors, Validators, AbstractControl} from '@angular/forms';
import {TrashCanService} from 'src/app/services/trash-can.service';
import {Course} from 'src/app/models/course';
import {Subscription} from "rxjs";

@Component({
  selector: 'app-student',
  templateUrl: './student.component.html',
  styles: []
})
export class StudentComponent implements OnInit, OnDestroy {
  @Input() public course: Course;
  public trashCanId: string;
  private trashCanSubscription: Subscription;

  public form = new FormGroup({
    room: new FormControl('', [
      Validators.required,
      Validators.maxLength(15), 
      this.roomValidator.bind(this)]),
  });

  constructor(private route: ActivatedRoute,
              private trashCanService: TrashCanService) {
  }

  ngOnInit() {
    this.trashCanId = localStorage.getItem('trashCan');

    if (this.trashCanId) {
      this.subscribeToTrashCan(this.trashCanId);
    }
  }

  ngOnDestroy(): void {
    if (this.trashCanId) {
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
        this.trashCanSet(trashCan.id);
        this.form.reset();
      })
  }

  private subscribeToTrashCan(id: string): void {
    this.trashCanSubscription = this.trashCanService.getTrashById(id)
      .subscribe((trashCan) => {
        if (!trashCan) {
          this.clearTrashCanId();
          this.trashCanSubscription.unsubscribe();
        }
      })
  }

  private trashCanSet(id: string): void {
    localStorage.setItem('trashCan', id);
    this.trashCanId = id;
    this.subscribeToTrashCan(id);
  }

  private clearTrashCanId(): void {
    localStorage.removeItem('trashCan');
    this.trashCanId = null;
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
