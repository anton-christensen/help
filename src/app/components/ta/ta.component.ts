import {Component, OnInit} from '@angular/core';
import {AuthService} from '../../services/auth.service';
import {TrashCanService} from 'src/app/services/trash-can.service';
import {Observable} from 'rxjs';
import {TrashCan} from 'src/app/models/trash-can';
import {CommonService} from 'src/app/services/common.service';
import {Course} from 'src/app/models/course';
import {SessionService} from '../../services/session.service';
import {switchMap} from 'rxjs/operators';

@Component({
  selector: 'app-ta',
  templateUrl: './ta.component.html',
  styleUrls: ['./ta.component.scss']
})
export class TaComponent implements OnInit {
  public course$: Observable<Course>;
  public trashCans$: Observable<TrashCan[]>;

  constructor(public auth: AuthService,
              private session: SessionService,
              private trashCanService: TrashCanService) {}

  ngOnInit() {
    this.course$ = this.session.getCourse$();

    this.trashCans$ = this.course$.pipe(
      switchMap((course) => {
        return this.trashCanService.getActiveByCourse(course);
      })
    );
  }

  public deleteTrashCan(can: TrashCan) {
    this.trashCanService.deleteTrashCan(can);
  }

  hasCreatedDate(trashCan: any): boolean {
    return CommonService.documentIsCreatedDatePresent(trashCan);
  }
}
