import {Component, OnDestroy, OnInit} from '@angular/core';
import {AuthService} from '../../services/auth.service';
import {TrashCanService} from 'src/app/services/trash-can.service';
import {Observable, of, Subscription} from 'rxjs';
import {TrashCan} from 'src/app/models/trash-can';
import {CommonService} from 'src/app/services/common.service';
import {Course} from 'src/app/models/course';
import {SessionService} from '../../services/session.service';
import {first, switchMap, tap} from 'rxjs/operators';

@Component({
  selector: 'app-assistant',
  templateUrl: './assistant.component.html',
  styleUrls: ['./assistant.component.scss']
})
export class AssistantComponent implements OnInit, OnDestroy {
  public course$: Observable<Course>;
  private trashCans$: Observable<TrashCan[]>;
  private trashCansSub: Subscription;
  public trashCans = [] as TrashCan[];

  constructor(public auth: AuthService,
              private commonService: CommonService,
              private session: SessionService,
              private trashCanService: TrashCanService) {}

  ngOnInit() {
    this.course$ = this.session.getCourse$();

    this.trashCans$ = this.course$.pipe(
      switchMap((course) => {
        this.commonService.setTitle(`${course.slug.toUpperCase()}`);

        if (course.enabled) {
          return this.trashCanService.getActiveByCourse(course);
        } else {
          return of([]);
        }
      })
    );

    this.trashCansSub = this.trashCans$
      .subscribe((trashCans) => {
        this.trashCans = trashCans;
        if (trashCans.length) {
          this.updateSecondsSince(trashCans);
          this.commonService.setTitlePre(`(${trashCans.length})`);
        } else {
          this.commonService.setTitlePre('');
        }
      });

    setInterval(() => {
      this.updateSecondsSince(this.trashCans);
    }, 1000);
  }

  ngOnDestroy() {
    this.trashCansSub.unsubscribe();
  }

  private updateSecondsSince(trashCans: TrashCan[]): void {
    const leftPadOneZero = (val) => `${val < 10 ? '0' : ''}${val}`;
    const now = new Date().getTime();

    for (const trashCan of trashCans) {
      const created = new Date(trashCan.created).getTime();
      const diffSeconds = Math.floor((now - created) / 1000);
      if (diffSeconds < 60) {
        trashCan.secondsSinceCreated = `00:${leftPadOneZero(diffSeconds)}`;
      } else {
        const min = Math.floor(diffSeconds / 60);
        const sec = diffSeconds % 60;
        trashCan.secondsSinceCreated = `${leftPadOneZero(min)}:${leftPadOneZero(sec)}`;
      }
    }
  }

  public deleteTrashCan(trashCan: TrashCan) {
    this.trashCanService.delete(trashCan).pipe(first()).subscribe();
  }

  public respondToTrashCan(trashCan: TrashCan) {
    this.trashCanService.respond(trashCan).pipe(first()).subscribe();
  }

  public retractResponseToTrashCan(trashCan: TrashCan) {
    this.trashCanService.retractRespond(trashCan).pipe(first()).subscribe();
  }
}
