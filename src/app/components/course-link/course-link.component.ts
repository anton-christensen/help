import {Component, Input} from '@angular/core';
import {Course } from 'src/app/models/course';

@Component({
  selector: 'app-course-link',
  templateUrl: './course-link.component.html',
  styleUrls: ['./course-link.component.scss']
})
export class CourseLinkComponent {
  @Input() public course: Course;
  constructor() { }
}
