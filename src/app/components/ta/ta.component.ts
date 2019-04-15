import { Component, OnInit, Input } from '@angular/core';
import {AuthService} from '../../services/auth.service';
import { TrashCanService } from 'src/app/services/trash-can.service';
import { Observable } from 'rxjs';
import { TrashCan } from 'src/app/models/trash-can';
import { CommonService } from 'src/app/services/common.service';
import { Course } from 'src/app/models/course';

@Component({
  selector: 'app-ta',
  templateUrl: './ta.component.html',
  styleUrls: ['./ta.component.scss']
})
export class TaComponent implements OnInit {
  @Input() public course: Course;
  trashCans$: Observable<TrashCan[]>;

  constructor(public auth: AuthService,
              private garbageCollector: TrashCanService,
              public common: CommonService) {}

  ngOnInit() {
    this.trashCans$ = this.garbageCollector.getTrashCans(this.course);
  }

  public deleteTrashCan(can: TrashCan) {
    this.garbageCollector.deleteTrashCan(can);
  }
}
