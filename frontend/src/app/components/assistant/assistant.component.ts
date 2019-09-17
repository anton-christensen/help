import {Component, OnInit} from '@angular/core';
import {AuthService} from '../../services/auth.service';
import {TrashCanService} from 'src/app/services/trash-can.service';
import {Observable} from 'rxjs';
import {TrashCan} from 'src/app/models/trash-can';
import {CommonService} from 'src/app/services/common.service';
import {Course} from 'src/app/models/course';
import {SessionService} from '../../services/session.service';
import {switchMap, tap} from 'rxjs/operators';

@Component({
  selector: 'app-assistant',
  templateUrl: './assistant.component.html',
  styleUrls: ['./assistant.component.scss']
})
export class AssistantComponent implements OnInit {
  public course$: Observable<Course>;
  public trashCans$: Observable<TrashCan[]>;

  constructor(public auth: AuthService,
              private commonService: CommonService,
              private session: SessionService,
              private trashCanService: TrashCanService) {}

  ngOnInit() {
    this.course$ = this.session.getCourse$();

    this.trashCans$ = this.course$.pipe(
      switchMap((course) => {
        return this.trashCanService.getActiveByCourse(course).pipe(
          tap((trashCans) => {
            if (trashCans.length) {
              this.commonService.setTitle(`(${trashCans.length}) ${course.slug.toUpperCase()}`);
            } else {
              this.commonService.setTitle(`${course.slug.toUpperCase()}`);
            }
          })
        );
      })
    );
  }

  public deleteTrashCan(can: TrashCan) {
    this.trashCanService.deleteTrashCan(can);
  }

  public hasCreatedDate(trashCan: any): boolean {
    return CommonService.documentIsCreatedDatePresent(trashCan);
  }
}
