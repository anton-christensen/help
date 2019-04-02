import {Component, OnInit} from '@angular/core';
import {AuthService} from './services/auth.service';
import {AngularFirestore} from '@angular/fire/firestore';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {AngularFireMessaging} from '@angular/fire/messaging';
import {ToastService} from './services/toasts.service';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styles: []
})
export class AppComponent implements OnInit {
  constructor(public auth: AuthService,
              public toastService: ToastService,
              private db: AngularFirestore,
              private afMessaging: AngularFireMessaging) {
  }

  ngOnInit(): void {
  }
}
