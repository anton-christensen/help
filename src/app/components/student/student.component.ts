import { Component, OnInit, Input } from '@angular/core';
import { TrashCanService } from 'src/app/services/trash-can.service';
import { FormGroup, FormControl, ValidationErrors, Validators, AbstractControl } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ToastService } from 'src/app/services/toasts.service';
import { CourseService } from 'src/app/services/course.service';
import { Observable } from 'rxjs';
import { Course } from 'src/app/models/course';

@Component({
  selector: 'app-student',
  templateUrl: './student.component.html',
  styles: []
})
export class StudentComponent implements OnInit {
  @Input() public course: Course;

  public form = new FormGroup({
    room: new FormControl('', [
      Validators.required, 
      Validators.minLength(3), 
      Validators.maxLength(15), 
      this.roomValidator.bind(this)]),
  });

  constructor(private route: ActivatedRoute,
              private trashCanService: TrashCanService,
              private courseService: CourseService,
              private toastService: ToastService) {
  }

  ngOnInit() {} 

  public onSubmit(): void {
    if (this.form.valid) {
      this.trashCanService.addTrashCan(this.course.slug, this.form.value.room)
        .then(() => {
          this.form.reset();
          this.toastService.add("Help is on the way!", 5000);
        })
    } else {
      console.error('You saved something invalid... How??')
    }
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
