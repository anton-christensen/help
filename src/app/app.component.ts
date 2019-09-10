import {Component, OnInit} from '@angular/core';
import {AuthService} from './services/auth.service';
import {fromEvent, Observable} from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  private online$: Observable<Event>;
  private offline$: Observable<Event>;
  public online = navigator.onLine;

  constructor(public auth: AuthService) {
  }

  ngOnInit(): void {
    this.online$ = fromEvent(window, 'online');
    this.offline$ = fromEvent(window, 'offline');

    this.online$
      .subscribe(() => this.online = true);

    this.offline$
      .subscribe(() => this.online = false);
  }
}
